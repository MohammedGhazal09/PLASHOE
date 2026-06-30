import { createHash } from 'node:crypto';
import { PAYMENT_PROVIDER_MODES, resolvePaymentProviderMode } from '../config/env.js';
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

const STRIPE_PAYMENT_PROVIDER = PAYMENT_PROVIDER_MODES.STRIPE;
const PAYPAL_PAYMENT_PROVIDER = PAYMENT_PROVIDER_MODES.PAYPAL;
const MOCK_PAYMENT_PROVIDER = PAYMENT_PROVIDER_MODES.MOCK;
const PENDING_PAYMENT_STATUSES = new Set(['requires_payment', 'payment_pending']);

const appendOrderIdParam = (baseUrl, orderId) => {
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}orderId=${encodeURIComponent(orderId.toString())}`;
};

const appendStripeReturnParams = (baseUrl, orderId) =>
  `${appendOrderIdParam(baseUrl, orderId)}&session_id={CHECKOUT_SESSION_ID}`;

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

const getPayPalCapture = (paypalOrder) => {
  const purchaseUnits = Array.isArray(paypalOrder?.purchase_units)
    ? paypalOrder.purchase_units
    : [];

  for (const purchaseUnit of purchaseUnits) {
    const captures = purchaseUnit?.payments?.captures;
    if (Array.isArray(captures) && captures.length > 0) {
      return captures[0];
    }
  }

  return null;
};

const getPayPalPayerId = (paypalOrder) =>
  paypalOrder?.payer?.payer_id ||
  paypalOrder?.payment_source?.paypal?.account_id ||
  paypalOrder?.payment_source?.paypal?.email_address ||
  null;

const toPaymentResponse = (order) => ({
  provider: order.paymentProvider || STRIPE_PAYMENT_PROVIDER,
  checkoutUrl: order.paymentCheckoutUrl,
  sessionId: order.paymentProviderSessionId,
  paymentIntentId: order.paymentProviderIntentId,
  demoMode: order.paymentProvider === MOCK_PAYMENT_PROVIDER,
});

const isReusablePendingPayment = (order) =>
  [STRIPE_PAYMENT_PROVIDER, PAYPAL_PAYMENT_PROVIDER, MOCK_PAYMENT_PROVIDER].includes(
    order?.paymentProvider
  ) &&
  order.paymentStatus === 'payment_pending' &&
  Boolean(order.paymentCheckoutUrl);

const buildMockCheckoutUrl = (orderId) =>
  `/checkout/mock?orderId=${encodeURIComponent(orderId.toString())}`;

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
  const providerName = resolvePaymentProviderMode();

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
    if (providerName === PAYPAL_PAYMENT_PROVIDER) {
      session = await provider.createPayPalOrder({
        order,
        user,
        successUrl: appendOrderIdParam(process.env.PAYMENT_SUCCESS_URL, order._id),
        cancelUrl: appendOrderIdParam(process.env.PAYMENT_CANCEL_URL, order._id),
        metadata,
        idempotencyKey: providerIdempotencyKey,
      });
    } else {
      session = await provider.createCheckoutSession({
        order,
        user,
        successUrl: appendStripeReturnParams(process.env.PAYMENT_SUCCESS_URL, order._id),
        cancelUrl: appendStripeReturnParams(process.env.PAYMENT_CANCEL_URL, order._id),
        metadata,
        idempotencyKey: providerIdempotencyKey,
      });
    }

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

export const capturePayPalPayment = async ({ user, orderId, token, provider = paymentProvider }) => {
  const order = await Order.findById(orderId);
  const paypalOrderId = typeof token === 'string' ? token.trim() : '';

  if (!order) {
    throw new CheckoutError('Order not found', 404);
  }

  if (order.user.toString() !== user._id.toString()) {
    throw new CheckoutError('Not authorized', 403);
  }

  if (order.paymentProvider !== PAYPAL_PAYMENT_PROVIDER) {
    throw new CheckoutError('Order is not using the PayPal payment provider', 400);
  }

  if (!paypalOrderId) {
    throw new CheckoutError('PayPal return token is required', 400);
  }

  if (order.paymentProviderSessionId !== paypalOrderId) {
    throw new CheckoutError('PayPal return token does not match this order', 400);
  }

  if (order.paymentStatus === 'paid') {
    return order;
  }

  if (!PENDING_PAYMENT_STATUSES.has(order.paymentStatus)) {
    throw new CheckoutError('PayPal payment can only be captured for pending payment orders', 400);
  }

  const capture = await provider.capturePayPalOrder({
    paypalOrderId,
    idempotencyKey: `capture-${createHash('sha256')
      .update(`${user._id.toString()}:${order._id.toString()}:${paypalOrderId}`)
      .digest('hex')}`,
  });
  const captureRecord = getPayPalCapture(capture);
  const captureStatus = (captureRecord?.status || capture?.status || '').toUpperCase();
  const providerIntentId = captureRecord?.id || capture?.id || paypalOrderId;
  const payerId = getPayPalPayerId(capture);

  if (payerId) {
    await Order.updateOne({ _id: order._id }, { $set: { paymentProviderCustomerId: payerId } });
  }

  if (captureStatus === 'COMPLETED') {
    return transitionOrderPaymentState({
      orderId,
      targetStatus: 'paid',
      providerIntentId,
    });
  }

  if (['DECLINED', 'DENIED', 'FAILED'].includes(captureStatus)) {
    return transitionOrderPaymentState({
      orderId,
      targetStatus: 'payment_failed',
      providerIntentId,
      failureReason: `paypal capture ${captureStatus.toLowerCase()}`,
    });
  }

  throw new CheckoutError('PayPal payment has not been completed yet', 424);
};
