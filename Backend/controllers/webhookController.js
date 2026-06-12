import Order from '../models/Order.js';
import PaymentEvent from '../models/PaymentEvent.js';
import * as paymentProvider from '../services/paymentProvider.js';
import { transitionOrderPaymentState } from '../services/paymentState.js';

const PROVIDER = 'stripe';

class WebhookReconciliationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WebhookReconciliationError';
  }
}

const getStripeObject = (event) => event?.data?.object || {};

const getMetadata = (value) => value?.metadata || {};

const getObjectId = (value) => (typeof value === 'string' ? value : value?.id || null);

const findOrderFromMetadata = async (metadata = {}) => {
  if (metadata.orderId) {
    const order = await Order.findById(metadata.orderId);
    if (order) return order;
  }

  if (metadata.orderNumber) {
    const order = await Order.findOne({ orderNumber: metadata.orderNumber });
    if (order) return order;
  }

  return null;
};

const findOrderByProviderIds = async (stripeObject) => {
  const sessionId = stripeObject.object === 'checkout.session' ? stripeObject.id : null;
  const intentId =
    stripeObject.object === 'payment_intent'
      ? stripeObject.id
      : getObjectId(stripeObject.payment_intent);

  if (sessionId) {
    const order = await Order.findOne({ paymentProviderSessionId: sessionId });
    if (order) return order;
  }

  if (intentId) {
    const order = await Order.findOne({ paymentProviderIntentId: intentId });
    if (order) return order;
  }

  return null;
};

const retrieveRelatedPaymentIntent = async (stripeObject) => {
  const paymentIntentId = getObjectId(stripeObject.payment_intent);

  if (!paymentIntentId) {
    return null;
  }

  return paymentProvider.retrievePaymentIntent({ paymentIntentId });
};

const resolveOrder = async (event) => {
  const stripeObject = getStripeObject(event);
  const directMetadata = getMetadata(stripeObject);
  const byMetadata = await findOrderFromMetadata(directMetadata);

  if (byMetadata) {
    return byMetadata;
  }

  const byProviderId = await findOrderByProviderIds(stripeObject);

  if (byProviderId) {
    return byProviderId;
  }

  const relatedPaymentIntent = await retrieveRelatedPaymentIntent(stripeObject);

  if (relatedPaymentIntent) {
    const byRelatedMetadata = await findOrderFromMetadata(getMetadata(relatedPaymentIntent));
    if (byRelatedMetadata) return byRelatedMetadata;

    const byRelatedIntent = await Order.findOne({ paymentProviderIntentId: relatedPaymentIntent.id });
    if (byRelatedIntent) return byRelatedIntent;
  }

  throw new WebhookReconciliationError('Webhook event could not be reconciled to a local order');
};

const syncProviderFields = async (order, stripeObject) => {
  const updates = {};

  if (stripeObject.object === 'checkout.session') {
    updates.paymentProviderSessionId = stripeObject.id || order.paymentProviderSessionId;
    updates.paymentProviderIntentId =
      getObjectId(stripeObject.payment_intent) || order.paymentProviderIntentId;
    updates.paymentProviderCustomerId = getObjectId(stripeObject.customer) || order.paymentProviderCustomerId;
  } else if (stripeObject.object === 'payment_intent') {
    updates.paymentProviderIntentId = stripeObject.id || order.paymentProviderIntentId;
    updates.paymentProviderCustomerId = getObjectId(stripeObject.customer) || order.paymentProviderCustomerId;
  } else if (stripeObject.payment_intent) {
    updates.paymentProviderIntentId =
      getObjectId(stripeObject.payment_intent) || order.paymentProviderIntentId;
  }

  if (Object.keys(updates).length > 0) {
    await Order.updateOne({ _id: order._id }, { $set: updates });
  }
};

const getFailureReason = (stripeObject) =>
  stripeObject.last_payment_error?.message ||
  stripeObject.last_payment_error?.code ||
  stripeObject.cancellation_reason ||
  stripeObject.status ||
  null;

const amountFromMinorUnits = (amount) => Number(amount || 0) / 100;

const isDuplicateKeyError = (error) => error?.code === 11000;

const claimPaymentEvent = async (event) => {
  try {
    const eventRecord = await PaymentEvent.create({
      provider: PROVIDER,
      providerEventId: event.id,
      eventType: event.type,
      status: 'processing',
    });

    return { eventRecord, duplicate: false };
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    const existingEvent = await PaymentEvent.findOne({
      provider: PROVIDER,
      providerEventId: event.id,
    });

    if (existingEvent?.status === 'failed') {
      const retryEvent = await PaymentEvent.findOneAndUpdate(
        {
          _id: existingEvent._id,
          status: 'failed',
        },
        {
          $set: {
            eventType: event.type,
            status: 'processing',
            processedAt: null,
            error: null,
          },
        },
        { new: true }
      );

      if (retryEvent) {
        return { eventRecord: retryEvent, duplicate: false };
      }
    }

    return { eventRecord: existingEvent, duplicate: true };
  }
};

const markPaymentEventProcessed = async ({ eventRecord, order }) =>
  PaymentEvent.updateOne(
    { _id: eventRecord._id },
    {
      $set: {
        order: order?._id || null,
        status: 'processed',
        processedAt: new Date(),
        error: null,
      },
    }
  );

const markPaymentEventFailed = async ({ eventRecord, error }) =>
  PaymentEvent.updateOne(
    { _id: eventRecord._id },
    {
      $set: {
        status: 'failed',
        processedAt: null,
        error: error?.message || 'Webhook processing failed',
      },
    }
  );

const toRefundRecord = ({ stripeObject, event }) => ({
  provider: PROVIDER,
  providerRefundId: stripeObject.id || event.id,
  amount: amountFromMinorUnits(stripeObject.amount),
  status: stripeObject.status || null,
  providerEventId: event.id,
  updatedAt: new Date(),
});

const mergeRefundRecord = ({ order, stripeObject, event }) => {
  if (!stripeObject.id && !event.id) {
    return null;
  }

  const existingRecords = Array.isArray(order.refundRecords) ? order.refundRecords : [];
  const refundRecords = existingRecords.map((record) => ({
    provider: record.provider || PROVIDER,
    providerRefundId: record.providerRefundId,
    amount: Number(record.amount || 0),
    status: record.status || null,
    providerEventId: record.providerEventId || null,
    updatedAt: record.updatedAt || new Date(),
  }));
  const nextRecord = toRefundRecord({ stripeObject, event });
  const existingIndex = refundRecords.findIndex(
    (record) =>
      record.provider === nextRecord.provider &&
      record.providerRefundId === nextRecord.providerRefundId
  );

  if (existingIndex >= 0) {
    refundRecords[existingIndex] = nextRecord;
  } else {
    refundRecords.push(nextRecord);
  }

  const recordsTotal = refundRecords.reduce((total, record) => total + Number(record.amount || 0), 0);
  const baselineAmount = existingRecords.length > 0 ? 0 : Number(order.refundAmount || 0);
  const refundAmount = Math.min(
    order.total,
    Math.max(Number(order.refundAmount || 0), baselineAmount + recordsTotal)
  );

  return { refundAmount, refundRecords };
};

const handleSuccess = async (event) => {
  const stripeObject = getStripeObject(event);
  const order = await resolveOrder(event);
  await syncProviderFields(order, stripeObject);

  return transitionOrderPaymentState({
    orderId: order._id,
    targetStatus: 'paid',
    providerIntentId:
      stripeObject.object === 'payment_intent'
        ? stripeObject.id
        : getObjectId(stripeObject.payment_intent) || order.paymentProviderIntentId,
  });
};

const handleFailure = async (event) => {
  const stripeObject = getStripeObject(event);
  const order = await resolveOrder(event);
  await syncProviderFields(order, stripeObject);

  return transitionOrderPaymentState({
    orderId: order._id,
    targetStatus: 'payment_failed',
    providerIntentId:
      stripeObject.object === 'payment_intent'
        ? stripeObject.id
        : getObjectId(stripeObject.payment_intent) || order.paymentProviderIntentId,
    failureReason: getFailureReason(stripeObject),
  });
};

const handleExpired = async (event) => {
  const stripeObject = getStripeObject(event);
  const order = await resolveOrder(event);
  await syncProviderFields(order, stripeObject);

  return transitionOrderPaymentState({
    orderId: order._id,
    targetStatus: 'payment_canceled',
    providerIntentId: getObjectId(stripeObject.payment_intent) || order.paymentProviderIntentId,
    failureReason: 'checkout.session.expired',
  });
};

const handleRefund = async (event) => {
  const stripeObject = getStripeObject(event);
  const order = await resolveOrder(event);
  const isChargeRefund = event.type === 'charge.refunded';
  const refundState = isChargeRefund ? null : mergeRefundRecord({ order, stripeObject, event });
  const refundAmount = isChargeRefund
    ? amountFromMinorUnits(stripeObject.amount_refunded)
    : refundState?.refundAmount ?? order.refundAmount;
  const fullAmount = isChargeRefund
    ? amountFromMinorUnits(stripeObject.amount_refunded) >= amountFromMinorUnits(stripeObject.amount)
    : refundAmount >= order.total;

  return transitionOrderPaymentState({
    orderId: order._id,
    targetStatus: fullAmount ? 'refunded' : 'partially_refunded',
    providerIntentId: getObjectId(stripeObject.payment_intent) || order.paymentProviderIntentId,
    refundAmount,
    refundRecords: refundState?.refundRecords,
  });
};

const dispatchEvent = async (event) => {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'payment_intent.succeeded':
      return handleSuccess(event);
    case 'payment_intent.payment_failed':
      return handleFailure(event);
    case 'checkout.session.expired':
      return handleExpired(event);
    case 'charge.refunded':
    case 'refund.updated':
      return handleRefund(event);
    default:
      return null;
  }
};

export const handleStripeWebhook = async (req, res) => {
  const signature = req.get('Stripe-Signature');
  let event;

  try {
    event = paymentProvider.constructWebhookEvent({
      payload: req.body,
      signature,
    });
  } catch {
    return res.status(400).json({
      success: false,
      message: 'Invalid Stripe webhook signature',
    });
  }

  let eventRecord;

  try {
    const claim = await claimPaymentEvent(event);

    if (claim.duplicate) {
      return res.json({
        success: true,
        message: 'Webhook event already accepted',
        data: {
          received: true,
          duplicate: true,
          status: claim.eventRecord?.status || 'unknown',
        },
      });
    }

    eventRecord = claim.eventRecord;
    const order = await dispatchEvent(event);

    await markPaymentEventProcessed({ eventRecord, order });

    return res.json({
      success: true,
      message: 'Webhook accepted',
      data: {
        received: true,
        eventId: event.id,
        eventType: event.type,
      },
    });
  } catch (error) {
    if (eventRecord) {
      await markPaymentEventFailed({ eventRecord, error });
    }

    console.error(error?.stack || error);
    return res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
    });
  }
};
