import { createHash } from 'node:crypto';
import Order from '../models/Order.js';
import {
  CheckoutError,
  compensateCheckoutSideEffects,
  createCheckoutFromCart,
  createPaymentStartError,
  validateIdempotencyKey,
} from './checkoutService.js';
import * as paymentProvider from './paymentProvider.js';

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
  provider: order.paymentProvider || 'stripe',
  checkoutUrl: order.paymentCheckoutUrl,
  sessionId: order.paymentProviderSessionId,
  paymentIntentId: order.paymentProviderIntentId,
});

const isReusablePendingPayment = (order) =>
  order?.paymentProvider === 'stripe' &&
  order.paymentStatus === 'payment_pending' &&
  Boolean(order.paymentCheckoutUrl);

const arePaymentsExplicitlyDisabled = (env = process.env) =>
  typeof env.PAYMENTS_ENABLED === 'string' &&
  env.PAYMENTS_ENABLED.trim().toLowerCase() === 'false';

export const startCheckoutPayment = async ({
  user,
  shippingAddress,
  notes,
  idempotencyKey,
  provider = paymentProvider,
}) => {
  if (arePaymentsExplicitlyDisabled()) {
    const error = new CheckoutError('Payments are currently disabled', 503, [
      {
        code: 'PAYMENTS_DISABLED',
        resource: 'payment',
      },
    ]);
    error.expose = true;
    throw error;
  }

  const localIdempotencyKey = validateIdempotencyKey(idempotencyKey);

  const checkout = await createCheckoutFromCart({
    userId: user._id,
    shippingAddress,
    notes,
    idempotencyKey: localIdempotencyKey,
    orderStatus: 'pending',
    paymentStatus: 'requires_payment',
    paymentProvider: 'stripe',
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

  const updatedOrder = await Order.findByIdAndUpdate(
    order._id,
    {
      $set: {
        paymentStatus: 'payment_pending',
        paymentProvider: 'stripe',
        paymentProviderSessionId: session.id,
        paymentProviderIntentId: getPaymentIntentId(session),
        paymentProviderCustomerId:
          typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
        paymentCheckoutUrl: session.url,
      },
    },
    { new: true }
  );

  return {
    order: updatedOrder,
    payment: toPaymentResponse(updatedOrder),
    replayed: false,
    statusCode: 201,
  };
};
