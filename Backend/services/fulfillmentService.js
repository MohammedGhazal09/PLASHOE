import Order from '../models/Order.js';

export const FULFILLMENT_ERROR_CODES = {
  INVALID_TRANSITION: 'INVALID_FULFILLMENT_TRANSITION',
  PAYMENT_NOT_SHIPPABLE: 'PAYMENT_NOT_SHIPPABLE',
  TRACKING_REQUIRED: 'TRACKING_REQUIRED',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
};

const SHIPPABLE_PAYMENT_STATUS_VALUES = ['paid', 'not_required'];
const SHIPPABLE_PAYMENT_STATUSES = new Set(SHIPPABLE_PAYMENT_STATUS_VALUES);
const ATOMIC_UPDATE_OPTIONS = { new: true, runValidators: true };

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const createFulfillmentError = ({ statusCode, message, code, orderId }) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.errors = [
    {
      code,
      resource: 'order',
      ...(orderId ? { orderId: orderId.toString() } : {}),
    },
  ];
  return error;
};

const assertShippablePayment = (order) => {
  const paymentStatus = order.paymentStatus || 'not_required';

  if (!SHIPPABLE_PAYMENT_STATUSES.has(paymentStatus)) {
    throw createFulfillmentError({
      statusCode: 409,
      message: 'Order payment status is not eligible for fulfillment',
      code: FULFILLMENT_ERROR_CODES.PAYMENT_NOT_SHIPPABLE,
      orderId: order._id,
    });
  }
};

const shippablePaymentFilter = () => ({
  $or: [
    { paymentStatus: { $in: SHIPPABLE_PAYMENT_STATUS_VALUES } },
    { paymentStatus: null },
    { paymentStatus: { $exists: false } },
  ],
});

const invalidTransition = (order) =>
  createFulfillmentError({
    statusCode: 409,
    message: `Cannot move order from ${order.status} to the requested fulfillment status`,
    code: FULFILLMENT_ERROR_CODES.INVALID_TRANSITION,
    orderId: order._id,
  });

const trackingRequired = (order) =>
  createFulfillmentError({
    statusCode: 409,
    message: 'Carrier and tracking number are required for fulfillment',
    code: FULFILLMENT_ERROR_CODES.TRACKING_REQUIRED,
    orderId: order._id,
  });

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
};

const latestHistoryEvent = (order, status) =>
  [...(order.trackingHistory || [])]
    .reverse()
    .find((event) => event.status === status);

const historyEvent = ({ status, description, location, now }) => ({
  status,
  timestamp: now,
  ...(description ? { description } : {}),
  ...(location ? { location } : {}),
});

const buildTrackingSet = (updates, { carrier, trackingNumber }) => {
  const fields = {
    carrier,
    trackingNumber,
  };

  if (hasOwn(updates, 'estimatedDeliveryDate')) {
    fields.estimatedDeliveryDate = updates.estimatedDeliveryDate || null;
  }

  return fields;
};

const loadOrderOrThrow = async (orderId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw createFulfillmentError({
      statusCode: 404,
      message: 'Order not found',
      code: FULFILLMENT_ERROR_CODES.ORDER_NOT_FOUND,
      orderId,
    });
  }

  return order;
};

const shippedAlreadyApplied = (order, updates) => {
  if (order.status !== 'shipped') {
    return false;
  }

  const carrier = updates.carrier ?? order.carrier;
  const trackingNumber = updates.trackingNumber ?? order.trackingNumber;
  const latestShipped = latestHistoryEvent(order, 'shipped');

  return (
    carrier === order.carrier &&
    trackingNumber === order.trackingNumber &&
    (!hasOwn(updates, 'estimatedDeliveryDate') ||
      normalizeDate(updates.estimatedDeliveryDate) === normalizeDate(order.estimatedDeliveryDate)) &&
    (!hasOwn(updates, 'description') ||
      (updates.description || undefined) === (latestShipped?.description || undefined)) &&
    (!hasOwn(updates, 'location') ||
      (updates.location || undefined) === (latestShipped?.location || undefined))
  );
};

const deliveredAlreadyApplied = (order, updates) => {
  if (order.status !== 'delivered') {
    return false;
  }

  const latestDelivered = latestHistoryEvent(order, 'delivered');

  return (
    (!hasOwn(updates, 'description') ||
      (updates.description || undefined) === (latestDelivered?.description || undefined)) &&
    (!hasOwn(updates, 'location') ||
      (updates.location || undefined) === (latestDelivered?.location || undefined))
  );
};

const noOpResult = (order) => ({
  order,
  changed: false,
  message: 'Fulfillment update already applied',
});

const resolveMissedShippedUpdate = async ({ orderId, updates, attemptsRemaining }) => {
  const order = await loadOrderOrThrow(orderId);

  if (shippedAlreadyApplied(order, updates)) {
    return noOpResult(order);
  }

  if (attemptsRemaining > 0 && ['processing', 'shipped'].includes(order.status)) {
    assertShippablePayment(order);
    return applyShippedUpdate(order, updates, new Date(), attemptsRemaining - 1);
  }

  assertShippablePayment(order);
  throw invalidTransition(order);
};

const resolveMissedDeliveredUpdate = async ({ orderId, updates, attemptsRemaining }) => {
  const order = await loadOrderOrThrow(orderId);

  if (deliveredAlreadyApplied(order, updates)) {
    return noOpResult(order);
  }

  if (attemptsRemaining > 0 && order.status === 'shipped') {
    assertShippablePayment(order);
    return applyDeliveredUpdate(order, updates, new Date(), attemptsRemaining - 1);
  }

  assertShippablePayment(order);

  if (order.status === 'shipped' && (!order.carrier || !order.trackingNumber)) {
    throw trackingRequired(order);
  }

  throw invalidTransition(order);
};

const applyShippedUpdate = async (order, updates, now, attemptsRemaining = 1) => {
  if (!['processing', 'shipped'].includes(order.status)) {
    throw invalidTransition(order);
  }

  const carrier = updates.carrier ?? order.carrier;
  const trackingNumber = updates.trackingNumber ?? order.trackingNumber;

  if (!carrier || !trackingNumber) {
    throw trackingRequired(order);
  }

  if (order.status === 'processing') {
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        status: 'processing',
        ...shippablePaymentFilter(),
      },
      {
        $set: {
          status: 'shipped',
          shippedAt: order.shippedAt || now,
          ...buildTrackingSet(updates, { carrier, trackingNumber }),
        },
        $push: {
          trackingHistory: historyEvent({
            status: 'shipped',
            description: updates.description,
            location: updates.location,
            now,
          }),
        },
        $inc: { __v: 1 },
      },
      ATOMIC_UPDATE_OPTIONS
    );

    if (!updatedOrder) {
      return resolveMissedShippedUpdate({
        orderId: order._id,
        updates,
        attemptsRemaining,
      });
    }

    return {
      order: updatedOrder,
      changed: true,
      message: 'Order marked as shipped',
    };
  }

  if (shippedAlreadyApplied(order, updates)) {
    return noOpResult(order);
  }

  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      status: 'shipped',
      __v: order.__v,
      ...shippablePaymentFilter(),
    },
    {
      $set: buildTrackingSet(updates, { carrier, trackingNumber }),
      $push: {
        trackingHistory: historyEvent({
          status: 'shipped',
          description: updates.description,
          location: updates.location,
          now,
        }),
      },
      $inc: { __v: 1 },
    },
    ATOMIC_UPDATE_OPTIONS
  );

  if (!updatedOrder) {
    return resolveMissedShippedUpdate({
      orderId: order._id,
      updates,
      attemptsRemaining,
    });
  }

  return {
    order: updatedOrder,
    changed: true,
    message: 'Shipment tracking updated',
  };
};

const applyDeliveredUpdate = async (order, updates, now, attemptsRemaining = 1) => {
  if (deliveredAlreadyApplied(order, updates)) {
    return noOpResult(order);
  }

  if (order.status !== 'shipped') {
    throw invalidTransition(order);
  }

  if (!order.carrier || !order.trackingNumber) {
    throw trackingRequired(order);
  }

  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      status: 'shipped',
      __v: order.__v,
      carrier: { $nin: [null, ''] },
      trackingNumber: { $nin: [null, ''] },
      ...shippablePaymentFilter(),
    },
    {
      $set: {
        status: 'delivered',
        deliveredAt: order.deliveredAt || now,
      },
      $push: {
        trackingHistory: historyEvent({
          status: 'delivered',
          description: updates.description,
          location: updates.location,
          now,
        }),
      },
      $inc: { __v: 1 },
    },
    ATOMIC_UPDATE_OPTIONS
  );

  if (!updatedOrder) {
    return resolveMissedDeliveredUpdate({
      orderId: order._id,
      updates,
      attemptsRemaining,
    });
  }

  return {
    order: updatedOrder,
    changed: true,
    message: 'Order marked as delivered',
  };
};

export const advanceOrderFulfillment = async ({ orderId, updates }) => {
  const order = await loadOrderOrThrow(orderId);

  if (updates.status === 'processing') {
    if (order.status === 'processing') {
      return noOpResult(order);
    }

    throw invalidTransition(order);
  }

  assertShippablePayment(order);

  const now = new Date();

  if (updates.status === 'shipped') {
    return applyShippedUpdate(order, updates, now);
  }

  if (updates.status === 'delivered') {
    return applyDeliveredUpdate(order, updates, now);
  }

  throw invalidTransition(order);
};
