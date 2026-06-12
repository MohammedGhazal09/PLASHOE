import Order, { PAYMENT_STATUSES } from '../models/Order.js';
import Product from '../models/Product.js';

const TERMINAL_UNPAID_STATUSES = new Set(['payment_failed', 'payment_canceled']);
const REFUND_STATUSES = new Set(['refunded', 'partially_refunded']);

const assertKnownTarget = (targetStatus) => {
  if (!PAYMENT_STATUSES.includes(targetStatus) || targetStatus === 'not_required') {
    throw new Error(`Unsupported payment status transition: ${targetStatus}`);
  }
};

export const restoreOrderInventoryOnce = async ({ order, session }) => {
  if (!order || order.inventoryDecremented !== true) {
    return false;
  }

  for (const item of order.items) {
    await Product.updateOne(
      { _id: item.product },
      { $inc: { stock: item.quantity } },
      { session }
    );
  }

  order.inventoryDecremented = false;
  return true;
};

export const transitionOrderPaymentState = async ({
  orderId,
  targetStatus,
  providerIntentId,
  failureReason,
  refundAmount,
  session,
}) => {
  assertKnownTarget(targetStatus);

  const order = await Order.findById(orderId).session(session);

  if (!order) {
    throw new Error('Order not found for payment transition');
  }

  if (targetStatus === 'paid') {
    order.paymentStatus = 'paid';
    order.status = 'processing';
    order.paidAt = order.paidAt || new Date();
    order.paymentFailureReason = null;

    if (providerIntentId) {
      order.paymentProviderIntentId = providerIntentId;
    }
  } else if (TERMINAL_UNPAID_STATUSES.has(targetStatus)) {
    await restoreOrderInventoryOnce({ order, session });
    order.paymentStatus = targetStatus;
    order.status = targetStatus === 'payment_canceled' ? 'cancelled' : 'pending';
    order.paymentFailureReason = failureReason || null;

    if (providerIntentId) {
      order.paymentProviderIntentId = providerIntentId;
    }
  } else if (REFUND_STATUSES.has(targetStatus)) {
    order.paymentStatus = targetStatus;
    order.refundedAt = new Date();
    order.refundAmount = Math.max(0, Number(refundAmount ?? order.refundAmount ?? 0));
  } else {
    order.paymentStatus = targetStatus;

    if (providerIntentId) {
      order.paymentProviderIntentId = providerIntentId;
    }
  }

  await order.save({ session });
  return order;
};
