import { createHash } from 'node:crypto';
import Order from '../models/Order.js';
import {
  CheckoutError,
  compensateCheckoutSideEffects,
  createCheckoutFromCart,
  createPaymentStartError,
  validateIdempotencyKey,
} from './checkoutService.js';
import { transitionOrderPaymentState } from './paymentState.js';
import * as paymentProvider from './paymentProvider.js';

const STRIPE_PAYMENT_PROVIDER = 'stripe';
const MOCK_PAYMENT_PROVIDER = 'mock';
const PENDING_PAYMENT_STATUSES = new Set(['requires_payment', 'payment_pending']);

const appendReturnParams = (baseUrl, orderId) => {
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}orderId=${encodeURIComponent(
    orderId.toString()
  )}&session_id={CHECKOUT_SESSION_ID}`;
};

const deriveProviderIdempotencyKey = ({ userId, localIdempotencyKey, orderId }) =>
  `checkout-${createHash('sha256')
    .update(`${userId.toString()}:${localIdempotencyKey}:${orderId.toString()}`)
    .digest('hex')}`;

const getPaymentIntentId = (session) => {
  if (!session?.payment_intent) return null;
  return typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent.id || null;
};

const toPaymentResponse = (order) => ({
  provider: order.paymentProvider || STRIPE_PAYMENT_PROVIDER,
  checkoutUrl: order.paymentCheckoutUrl,
  sessionId: order.paymentProviderSessionId,
  paymentIntentId: order.paymentProviderIntentId,
  demoMode: order.paymentProvider === MOCK_PAYMENT_PROVIDER,
});

const isReusablePendingPayment = (order) =>
  [STRIPE_PAYMENT_PROVIDER, MOCK_PAYMENT_PROVIDER].includes(order?.paymentProvider) &&
  order.paymentStatus === 'payment_pending' &&
  Boolean(order.paymentCheckoutUrl);

const getTrimmedEnv = (env, key) => {
  const value = env[key];
  return typeof value === 'string' ? value.trim() : '';
};

const hasCompleteStripeConfig = (env = process.env) =>
  Boolean(
    getTrimmedEnv(env, 'STRIPE_SECRET_KEY') &&
      getTrimmedEnv(env, 'STRIPE_WEBHOOK_SECRET') &&
      getTrimmedEnv(env, 'PAYMENT_SUCCESS_URL') &&
      getTrimmedEnv(env, 'PAYMENT_CANCEL_URL')
  );

const shouldUseMockPaymentProvider = (env = process.env) =>
  (typeof env.PAYMENTS_ENABLED === 'string' &&
    env.PAYMENTS_ENABLED.trim().toLowerCase() === 'false') ||
  !hasCompleteStripeConfig(env);

const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const getFrontendUrl = () =>
  trimTrailingSlash(process.env.FRONTEND_URL || 'http://localhost:3000');

const buildMockCheckoutUrl = (orderId) =>
  `${getFrontendUrl()}/checkout/mock?orderId=${encodeURIComponent(orderId.toString())}`;

const createMockSession = (order) => ({
  id: `mock-session-${order._id}`,
  url: buildMockCheckoutUrl(order._id),
});

const updateOrderPaymentSession = async ({ order, providerName, session }) =>
  Order.findByIdAndUpdate(
    order._id,
    {
      $set: {
        paymentStatus: 'payment_pending',
        paymentProvider: providerName,
        paymentProviderSessionId: session.id,
        paymentProviderIntentId:
          providerName === STRIPE_PAYMENT_PROVIDER ? getPaymentIntentId(session) : null,
        paymentProviderCustomerId:
          providerName === STRIPE_PAYMENT_PROVIDER
            ? typeof session.customer === 'string'
              ? session.customer
              : session.customer?.id || null
            : null,
        paymentCheckoutUrl: session.url,
      },
    },
    { new: true }
  );

export const startCheckoutPayment = async ({
  user,
  shippingAddress,
  shippingMethodId,
  notes,
  idempotencyKey,
  provider = paymentProvider,
}) => {
  const localIdempotencyKey = validateIdempotencyKey(idempotencyKey);
  const providerName = shouldUseMockPaymentProvider()
    ? MOCK_PAYMENT_PROVIDER
    : STRIPE_PAYMENT_PROVIDER;

  const checkout = await createCheckoutFromCart({
    userId: user._id,
    shippingAddress,
    shippingMethodId,
    notes,
    idempotencyKey: localIdempotencyKey,
    orderStatus: 'pending',
    paymentStatus: 'requires_payment',
    paymentProvider: providerName,
  });

  if (checkout.replayed && isReusablePendingPayment(checkout.order)) {
    return {
      order: checkout.order,
      payment: toPaymentResponse(checkout.order),
      replayed: true,
      statusCode: 200,
    };
  }

  if (checkout.replayed) {
    throw createPaymentStartError();
  }

  const order = checkout.order;

  if (providerName === MOCK_PAYMENT_PROVIDER) {
    const updatedOrder = await updateOrderPaymentSession({
      order,
      providerName,
      session: createMockSession(order),
    });

    return {
      order: updatedOrder,
      payment: toPaymentResponse(updatedOrder),
      replayed: false,
      statusCode: 201,
    };
  }

  const metadata = {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    userId: user._id.toString(),
    idempotencyKey: localIdempotencyKey,
  };
  const providerIdempotencyKey = deriveProviderIdempotencyKey({
    userId: user._id,
    localIdempotencyKey,
    orderId: order._id,
  });

  let session;

  try {
    session = await provider.createCheckoutSession({
      order,
      user,
      successUrl: appendReturnParams(process.env.PAYMENT_SUCCESS_URL, order._id),
      cancelUrl: appendReturnParams(process.env.PAYMENT_CANCEL_URL, order._id),
      metadata,
      idempotencyKey: providerIdempotencyKey,
    });

    if (!session?.url || !session?.id) {
      throw new Error('Payment provider did not return a checkout URL');
    }
  } catch {
    await compensateCheckoutSideEffects({ userId: user._id, orderId: order._id });
    throw createPaymentStartError();
  }

  const updatedOrder = await updateOrderPaymentSession({
    order,
    providerName,
    session,
  });

  return {
    order: updatedOrder,
    payment: toPaymentResponse(updatedOrder),
    replayed: false,
    statusCode: 201,
  };
};

export const completeMockPayment = async ({ user, orderId, outcome }) => {
  const order = await Order.findById(orderId);
  const normalizedOutcome = typeof outcome === 'string' ? outcome.trim().toLowerCase() : '';

  if (!order) {
    throw new CheckoutError('Order not found', 404);
  }

  if (order.user.toString() !== user._id.toString()) {
    throw new CheckoutError('Not authorized', 403);
  }

  if (order.paymentProvider !== MOCK_PAYMENT_PROVIDER) {
    throw new CheckoutError('Order is not using the mock payment provider', 400);
  }

  if (!PENDING_PAYMENT_STATUSES.has(order.paymentStatus)) {
    throw new CheckoutError('Mock payment can only be completed for pending payment orders', 400);
  }

  if (!['approve', 'decline', 'cancel'].includes(normalizedOutcome)) {
    throw new CheckoutError('Unsupported mock payment outcome', 400);
  }

  const providerIntentId = `mock-${normalizedOutcome}-${order._id}`;

  if (normalizedOutcome === 'approve') {
    return transitionOrderPaymentState({
      orderId,
      targetStatus: 'paid',
      providerIntentId,
    });
  }

  if (normalizedOutcome === 'decline') {
    return transitionOrderPaymentState({
      orderId,
      targetStatus: 'payment_failed',
      providerIntentId,
      failureReason: 'mock payment declined',
    });
  }

  return transitionOrderPaymentState({
    orderId,
    targetStatus: 'payment_canceled',
    providerIntentId,
    failureReason: 'mock checkout canceled',
  });
};
