import Order, { PAYMENT_STATUSES } from '../models/Order.js';
import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';

const TERMINAL_UNPAID_STATUSES = new Set(['payment_failed', 'payment_canceled']);
const REFUND_STATUSES = new Set(['refunded', 'partially_refunded']);
const PAYMENT_CAPTURE_STATUSES = new Set(['requires_payment', 'payment_pending']);
const PAID_LIKE_STATUSES = new Set(['paid', 'refunded', 'partially_refunded']);

const assertKnownTarget = (targetStatus) => {
  if (!PAYMENT_STATUSES.includes(targetStatus) || targetStatus === 'not_required') {
    throw new Error(`Unsupported payment status transition: ${targetStatus}`);
  }
};

export const releaseOrderReservationsOnce = async ({ order, session }) => {
  if (!order || order.inventoryDecremented !== true) {
    return false;
  }

  const transition = await Order.updateOne(
    {
      _id: order._id,
      inventoryDecremented: true,
    },
    { $set: { inventoryDecremented: false } },
    { session }
  );

  if (transition.modifiedCount !== 1) {
    order.inventoryDecremented = false;
    return false;
  }

  for (const item of order.items) {
    await Product.updateOne(
      { _id: item.product },
      { $inc: { stock: item.quantity } },
      { session }
    );
  }

  if (order.couponCode) {
    await Coupon.updateOne(
      { code: order.couponCode, usedCount: { $gt: 0 } },
      { $inc: { usedCount: -1 } },
      { session }
    );
  }

  order.inventoryDecremented = false;
  return true;
};

export const restoreOrderInventoryOnce = releaseOrderReservationsOnce;

const isCheckoutHoldExpired = (order) =>
  order.checkoutHoldExpiresAt instanceof Date &&
  order.checkoutHoldExpiresAt.getTime() <= Date.now();

export const transitionOrderPaymentState = async ({
  orderId,
  targetStatus,
  providerIntentId,
  failureReason,
  refundAmount,
  refundRecords,
  session,
}) => {
  assertKnownTarget(targetStatus);

  const order = await Order.findById(orderId).session(session);

  if (!order) {
    throw new Error('Order not found for payment transition');
  }

  if (targetStatus === 'paid') {
    if (order.paymentStatus === 'paid') {
      if (providerIntentId) {
        order.paymentProviderIntentId = providerIntentId;
      }
      await order.save({ session });
      return order;
    }

    if (isCheckoutHoldExpired(order)) {
      await releaseOrderReservationsOnce({ order, session });
      order.paymentStatus = 'payment_canceled';
      order.status = 'cancelled';
      order.paymentFailureReason = 'checkout hold expired before payment capture';
      order.checkoutHoldExpiresAt = null;
      await order.save({ session });
      return order;
    }

    if (
      !PAYMENT_CAPTURE_STATUSES.has(order.paymentStatus) ||
      order.status === 'cancelled' ||
      order.inventoryDecremented !== true
    ) {
      return order;
    }

    order.paymentStatus = 'paid';
    order.status = 'processing';
    order.paidAt = order.paidAt || new Date();
    order.paymentFailureReason = null;
    order.checkoutHoldExpiresAt = null;

    if (providerIntentId) {
      order.paymentProviderIntentId = providerIntentId;
    }
  } else if (TERMINAL_UNPAID_STATUSES.has(targetStatus)) {
    if (PAID_LIKE_STATUSES.has(order.paymentStatus)) {
      return order;
    }

    await releaseOrderReservationsOnce({ order, session });
    order.paymentStatus = targetStatus;
    order.status = targetStatus === 'payment_canceled' ? 'cancelled' : 'pending';
    order.paymentFailureReason = failureReason || null;
    order.checkoutHoldExpiresAt = null;

    if (providerIntentId) {
      order.paymentProviderIntentId = providerIntentId;
    }
  } else if (REFUND_STATUSES.has(targetStatus)) {
    order.paymentStatus = targetStatus;
    order.refundedAt = new Date();
    order.refundAmount = Math.max(0, Number(refundAmount ?? order.refundAmount ?? 0));

    if (refundRecords) {
      order.refundRecords = refundRecords;
    }

    if (providerIntentId) {
      order.paymentProviderIntentId = providerIntentId;
    }
  } else {
    order.paymentStatus = targetStatus;

    if (providerIntentId) {
      order.paymentProviderIntentId = providerIntentId;
    }
  }

  await order.save({ session });
  return order;
};
