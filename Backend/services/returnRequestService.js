import ReturnRequest from '../models/ReturnRequest.js';
import Order from '../models/Order.js';

const DEFAULT_RETURN_WINDOW_DAYS = 30;
const ELIGIBLE_PAYMENT_STATUSES = new Set(['paid', 'not_required']);
const NON_CONSUMING_STATUSES = new Set(['rejected', 'cancelled']);

const ADMIN_TRANSITIONS = {
  requested: new Set(['approved', 'rejected']),
  approved: new Set(['received', 'rejected']),
  received: new Set(['resolved', 'rejected']),
};

export class ReturnRequestError extends Error {
  constructor(statusCode, code, message, details = []) {
    super(message);
    this.name = 'ReturnRequestError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const getReturnWindowDays = () => {
  const value = Number(process.env.RETURN_WINDOW_DAYS || DEFAULT_RETURN_WINDOW_DAYS);
  return Number.isInteger(value) && value > 0 && value <= 365
    ? value
    : DEFAULT_RETURN_WINDOW_DAYS;
};

const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const toIdString = (value) => String(value?._id || value || '');

const getRefundIds = (order) =>
  (order.refundRecords || [])
    .map((record) => record.providerRefundId)
    .filter(Boolean);

const buildHistoryEntry = ({ status, note, actor, actorRole }) => ({
  status,
  note: note || null,
  actor: actor?._id || actor || null,
  actorRole,
  timestamp: new Date(),
});

const assertOrderEligible = (order) => {
  if (!order) {
    throw new ReturnRequestError(404, 'ORDER_NOT_FOUND', 'Order not found');
  }

  if (order.status !== 'delivered' || !order.deliveredAt) {
    throw new ReturnRequestError(
      409,
      'ORDER_NOT_DELIVERED',
      'Only delivered orders can be returned or exchanged'
    );
  }

  if (!ELIGIBLE_PAYMENT_STATUSES.has(order.paymentStatus || 'not_required')) {
    throw new ReturnRequestError(
      409,
      'PAYMENT_NOT_ELIGIBLE',
      'This order payment state is not eligible for a new return or exchange request'
    );
  }

  const returnWindowDays = getReturnWindowDays();
  const windowEndsAt = addDays(new Date(order.deliveredAt), returnWindowDays);

  if (windowEndsAt.getTime() < Date.now()) {
    throw new ReturnRequestError(
      409,
      'RETURN_WINDOW_EXPIRED',
      'The return window for this order has expired'
    );
  }

  return { returnWindowDays, windowEndsAt };
};

const getConsumedQuantities = async (orderId) => {
  const activeRequests = await ReturnRequest.find({
    order: orderId,
    status: { $nin: [...NON_CONSUMING_STATUSES] },
  }).select('items');

  const consumed = new Map();

  for (const request of activeRequests) {
    for (const item of request.items || []) {
      const key = toIdString(item.orderItemId);
      consumed.set(key, (consumed.get(key) || 0) + Number(item.quantity || 0));
    }
  }

  return consumed;
};

const normalizeRequestedItems = ({ order, requestedItems, requestType, consumedQuantities }) => {
  const byOrderItemId = new Map();

  for (const item of requestedItems) {
    const key = toIdString(item.orderItemId);
    const orderItem = order.items.id(key);

    if (!orderItem) {
      throw new ReturnRequestError(
        400,
        'ORDER_ITEM_NOT_FOUND',
        'One or more requested items do not belong to this order',
        [{ orderItemId: key }]
      );
    }

    const current = byOrderItemId.get(key) || {
      orderItem,
      quantity: 0,
      reason: item.reason,
      exchangeSize: item.exchangeSize,
    };

    current.quantity += Number(item.quantity || 0);
    current.reason = item.reason || current.reason;
    current.exchangeSize = item.exchangeSize || current.exchangeSize;
    byOrderItemId.set(key, current);
  }

  return [...byOrderItemId.entries()].map(([key, item]) => {
    const consumed = consumedQuantities.get(key) || 0;
    const available = Number(item.orderItem.quantity || 0) - consumed;

    if (item.quantity > available) {
      throw new ReturnRequestError(
        409,
        'QUANTITY_EXCEEDS_ELIGIBLE',
        'Requested quantity exceeds the remaining eligible item quantity',
        [{ orderItemId: key, requested: item.quantity, available }]
      );
    }

    if (requestType === 'exchange' && !item.exchangeSize) {
      throw new ReturnRequestError(
        400,
        'EXCHANGE_SIZE_REQUIRED',
        'Exchange requests require a desired exchange size',
        [{ orderItemId: key }]
      );
    }

    return {
      orderItemId: item.orderItem._id,
      product: item.orderItem.product || null,
      name: item.orderItem.name,
      image: item.orderItem.image || '',
      size: item.orderItem.size,
      quantity: item.quantity,
      price: Number(item.orderItem.price || 0),
      reason: item.reason,
      exchangeSize: requestType === 'exchange' ? Number(item.exchangeSize) : null,
    };
  });
};

const calculateRequestedAmount = (type, items) => {
  if (type !== 'return') return 0;
  return items.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 0), 0);
};

export const createReturnRequestForOrder = async ({ user, payload }) => {
  const order = await Order.findOne({ _id: payload.orderId, user: user._id });
  const eligibility = assertOrderEligible(order);
  const consumedQuantities = await getConsumedQuantities(order._id);
  const items = normalizeRequestedItems({
    order,
    requestedItems: payload.items,
    requestType: payload.type,
    consumedQuantities,
  });
  const requestedAmount = calculateRequestedAmount(payload.type, items);

  return ReturnRequest.create({
    user: user._id,
    order: order._id,
    orderNumber: order.orderNumber,
    type: payload.type,
    status: 'requested',
    items,
    customerNotes: payload.customerNotes || null,
    eligibilitySnapshot: {
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
      deliveredAt: order.deliveredAt,
      returnWindowDays: eligibility.returnWindowDays,
      windowEndsAt: eligibility.windowEndsAt,
    },
    refundIntent: {
      requestedAmount,
      resolvedAmount: 0,
      status: payload.type === 'return' ? 'manual_review_required' : 'not_applicable',
      orderPaymentStatusAtRequest: order.paymentStatus,
      orderRefundAmountAtRequest: Number(order.refundAmount || 0),
      providerRefundIdsAtRequest: getRefundIds(order),
    },
    statusHistory: [
      buildHistoryEntry({
        status: 'requested',
        note: payload.customerNotes,
        actor: user._id,
        actorRole: 'customer',
      }),
    ],
  });
};

export const updateReturnRequestStatus = async ({ requestId, adminUser, payload }) => {
  const request = await ReturnRequest.findById(requestId);

  if (!request) {
    throw new ReturnRequestError(404, 'RETURN_REQUEST_NOT_FOUND', 'Return request not found');
  }

  const allowed = ADMIN_TRANSITIONS[request.status];

  if (!allowed?.has(payload.status)) {
    throw new ReturnRequestError(
      409,
      'INVALID_RETURN_STATUS_TRANSITION',
      `Cannot move return request from ${request.status} to ${payload.status}`
    );
  }

  request.status = payload.status;
  request.adminNotes = payload.note || request.adminNotes || null;

  if (payload.status === 'rejected') {
    request.refundIntent.status = 'rejected';
  }

  if (payload.status === 'resolved') {
    request.refundIntent.resolvedAmount = Number(payload.refundAmount || 0);
    request.refundIntent.status =
      request.type === 'return' && request.refundIntent.resolvedAmount > 0
        ? 'manual_refund_recorded'
        : 'not_applicable';
    request.refundIntent.resolvedAt = new Date();
  }

  request.statusHistory.push(
    buildHistoryEntry({
      status: payload.status,
      note: payload.note,
      actor: adminUser._id,
      actorRole: 'admin',
    })
  );

  await request.save();
  return request.populate([
    { path: 'user', select: 'name email' },
    { path: 'order', select: 'orderNumber status paymentStatus deliveredAt refundAmount total' },
  ]);
};
