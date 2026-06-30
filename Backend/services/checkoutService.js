import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { CHECKOUT_HOLDS } from '../config/security.js';
import {
  DEFAULT_SHIPPING_METHOD_ID,
  findShippingRuleForCountry,
} from '../config/shippingRules.js';
import { releaseOrderReservationsOnce } from './paymentState.js';

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,200}$/;
const ACTIVE_HOLD_PAYMENT_STATUSES = ['requires_payment', 'payment_pending'];
const CANCELLABLE_PAYMENT_STATUSES = [
  'requires_payment',
  'payment_pending',
  'payment_failed',
  'payment_canceled',
  'not_required',
];

export class CheckoutError extends Error {
  constructor(message, statusCode = 400, errors = []) {
    super(message);
    this.name = 'CheckoutError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

const toIdString = (value) => {
  if (!value) return '';
  if (value._id) return value._id.toString();
  return value.toString();
};

const stableValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        if (value[key] !== undefined) {
          result[key] = stableValue(value[key]);
        }
        return result;
      }, {});
  }

  return value ?? null;
};

const fingerprint = (value) =>
  createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex');

export const validateIdempotencyKey = (value) => {
  const key = typeof value === 'string' ? value.trim() : '';

  if (!key) {
    throw new CheckoutError('Idempotency-Key header is required', 400, [
      {
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        resource: 'checkout',
        checkoutAttempt: 'missing',
      },
    ]);
  }

  if (!IDEMPOTENCY_KEY_PATTERN.test(key)) {
    throw new CheckoutError('Idempotency-Key header is invalid', 400, [
      {
        code: 'IDEMPOTENCY_KEY_INVALID',
        resource: 'checkout',
        checkoutAttempt: 'invalid',
      },
    ]);
  }

  return key;
};

const createConflict = (message, errors) =>
  new CheckoutError(message, 409, errors);

const createNotFound = (message) => new CheckoutError(message, 404);

const createForbidden = (message) => new CheckoutError(message, 403);

const createBadRequest = (message) => new CheckoutError(message, 400);
const createFailedDependency = (message) => new CheckoutError(message, 424);

const getCart = (userId, session) =>
  Cart.findOne({ user: userId })
    .populate('items.product', 'name image price stock')
    .session(session);

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const buildCheckoutFingerprint = (cart, { shippingAddress, shippingMethodId, notes }) => {
  const lines = cart.items
    .map((item) => ({
      cartItemId: toIdString(item._id),
      productId: toIdString(item.product),
      quantity: item.quantity,
      size: item.size,
      priceAtAdd: item.priceAtAdd,
    }))
    .sort((a, b) => {
      const productCompare = a.productId.localeCompare(b.productId);
      if (productCompare !== 0) return productCompare;
      return Number(a.size) - Number(b.size);
    });

  return fingerprint({
    items: lines,
    couponCode: cart.couponCode || null,
    discount: cart.discount || 0,
    shippingAddress,
    shippingMethodId: shippingMethodId || DEFAULT_SHIPPING_METHOD_ID,
    notes: notes || '',
  });
};

const buildOrderItems = (cart) =>
  cart.items.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    image: item.product.image,
    quantity: item.quantity,
    size: item.size,
    price: item.priceAtAdd,
  }));

const calculateTotals = (cart) => {
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.priceAtAdd * item.quantity,
    0
  );
  const discount = cart.discount || 0;
  const discountAmount = roundMoney((subtotal * discount) / 100);
  const merchandiseTotal = roundMoney(subtotal - discountAmount);

  return {
    subtotal,
    discount,
    discountAmount,
    merchandiseTotal,
    total: merchandiseTotal,
  };
};

const createShippingCountryError = (country) =>
  new CheckoutError(`We do not ship to ${country || 'that country'} yet.`, 400, [
    {
      code: 'SHIPPING_COUNTRY_UNSUPPORTED',
      resource: 'shipping',
      country: country || null,
    },
  ]);

const createShippingMethodError = ({ country, shippingMethodId }) =>
  new CheckoutError('Selected shipping method is not available for this country', 400, [
    {
      code: 'SHIPPING_METHOD_UNAVAILABLE',
      resource: 'shipping',
      country,
      shippingMethodId,
    },
  ]);

const resolveShippingQuote = ({ country, shippingMethodId }) => {
  const requestedCountry = typeof country === 'string' ? country.trim() : '';
  const rule = findShippingRuleForCountry(requestedCountry);

  if (!rule) {
    throw createShippingCountryError(requestedCountry);
  }

  const selectedMethodId = shippingMethodId || DEFAULT_SHIPPING_METHOD_ID;
  const method = rule.methods.find((candidate) => candidate.id === selectedMethodId);

  if (!method) {
    throw createShippingMethodError({
      country: rule.country,
      shippingMethodId: selectedMethodId,
    });
  }

  return {
    ...method,
    price: roundMoney(method.price),
    country: rule.country,
    countryCode: rule.countryCode,
  };
};

const addShippingTotalsToMethods = ({ methods, merchandiseTotal }) =>
  methods.map((method) => ({
    ...method,
    price: roundMoney(method.price),
    orderTotal: roundMoney(merchandiseTotal + method.price),
  }));

export const getShippingOptionsForCart = async ({ userId, country }) => {
  const requestedCountry = typeof country === 'string' ? country.trim() : '';
  const rule = findShippingRuleForCountry(requestedCountry);

  if (!rule) {
    throw createShippingCountryError(requestedCountry);
  }

  const cart = await Cart.findOne({ user: userId });
  const totals = cart
    ? calculateTotals(cart)
    : {
        subtotal: 0,
        discount: 0,
        discountAmount: 0,
        merchandiseTotal: 0,
      };

  return {
    country: rule.country,
    countryCode: rule.countryCode,
    defaultMethodId: DEFAULT_SHIPPING_METHOD_ID,
    subtotal: totals.subtotal,
    discount: totals.discount,
    discountAmount: totals.discountAmount,
    merchandiseTotal: totals.merchandiseTotal,
    methods: addShippingTotalsToMethods({
      methods: rule.methods,
      merchandiseTotal: totals.merchandiseTotal,
    }),
  };
};

const getCartItemProductId = (item) =>
  toIdString(item.product) ||
  toIdString(typeof item.populated === 'function' ? item.populated('product') : null);

const productConflict = ({ code, item, requested, available = 0 }) => ({
  code,
  resource: 'product',
  productId: getCartItemProductId(item),
  cartItemId: toIdString(item._id),
  requested,
  available,
});

const getRequestedByProduct = (cart) => {
  const requested = new Map();

  for (const item of cart.items) {
    if (!item.product || !item.product._id) {
      throw createConflict('A cart item is no longer available', [
        productConflict({
          code: 'PRODUCT_UNAVAILABLE',
          item,
          requested: item.quantity,
          available: 0,
        }),
      ]);
    }

    const productId = toIdString(item.product._id);
    const current = requested.get(productId) || {
      product: item.product,
      items: [],
      quantity: 0,
    };

    current.items.push(item);
    current.quantity += item.quantity;
    requested.set(productId, current);
  }

  return requested;
};

const decrementStock = async (cart, session) => {
  const requestedByProduct = getRequestedByProduct(cart);

  for (const { product, items, quantity } of requestedByProduct.values()) {
    const result = await Product.updateOne(
      { _id: product._id, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { session }
    );

    if (result.modifiedCount !== 1) {
      const freshProduct = await Product.findById(product._id).session(session);
      const firstItem = items[0];

      throw createConflict('Insufficient stock for one or more cart items', [
        productConflict({
          code: freshProduct ? 'INSUFFICIENT_STOCK' : 'PRODUCT_UNAVAILABLE',
          item: firstItem,
          requested: quantity,
          available: freshProduct?.stock ?? 0,
        }),
      ]);
    }
  }
};

const buildCouponFilter = (coupon, now) => {
  const filter = {
    _id: coupon._id,
    isActive: true,
    $and: [
      {
        $or: [
          { validFrom: { $exists: false } },
          { validFrom: null },
          { validFrom: { $lte: now } },
        ],
      },
      {
        $or: [
          { validUntil: { $exists: false } },
          { validUntil: null },
          { validUntil: { $gte: now } },
        ],
      },
    ],
  };

  if (coupon.maxUses !== null && coupon.maxUses !== undefined) {
    filter.$expr = { $lt: ['$usedCount', '$maxUses'] };
  }

  return filter;
};

const incrementCouponUsage = async (cart, subtotal, session) => {
  if (!cart.couponCode) return;

  const now = new Date();
  const coupon = await Coupon.findOne({ code: cart.couponCode }).session(session);

  if (!coupon) {
    throw createConflict('Coupon is no longer available', [
      {
        code: 'COUPON_UNAVAILABLE',
        resource: 'coupon',
        couponCode: cart.couponCode,
      },
    ]);
  }

  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    throw createConflict('Coupon minimum order amount is no longer met', [
      {
        code: 'COUPON_MINIMUM_NOT_MET',
        resource: 'coupon',
        couponCode: coupon.code,
        requested: subtotal,
        available: coupon.minOrderAmount,
      },
    ]);
  }

  const result = await Coupon.updateOne(
    buildCouponFilter(coupon, now),
    { $inc: { usedCount: 1 } },
    { session }
  );

  if (result.modifiedCount !== 1) {
    throw createConflict('Coupon is not valid or has reached its usage limit', [
      {
        code: 'COUPON_USAGE_LIMIT_REACHED',
        resource: 'coupon',
        couponCode: coupon.code,
        requested: coupon.usedCount + 1,
        available: coupon.maxUses,
      },
    ]);
  }
};

const resolveExistingOrder = async ({
  userId,
  idempotencyKey,
  cart,
  shippingAddress,
  shippingMethodId,
  notes,
  session,
}) => {
  const existingOrder = await Order.findOne({
    user: userId,
    idempotencyKey,
  }).session(session);

  if (!existingOrder) return null;

  if (!cart || cart.items.length === 0) {
    return {
      order: existingOrder,
      replayed: true,
      statusCode: 200,
    };
  }

  const currentFingerprint = buildCheckoutFingerprint(cart, {
    shippingAddress,
    shippingMethodId,
    notes,
  });

  if (currentFingerprint === existingOrder.cartFingerprint) {
    return {
      order: existingOrder,
      replayed: true,
      statusCode: 200,
    };
  }

  throw createConflict('Idempotency key was already used for a different checkout state', [
    {
      code: 'IDEMPOTENCY_KEY_CONFLICT',
      resource: 'checkout',
      checkoutAttempt: idempotencyKey,
    },
  ]);
};

const runHook = async (hooks, name) => {
  if (typeof hooks?.[name] === 'function') {
    await hooks[name]();
  }
};

export const releaseExpiredCheckoutHolds = async ({ session, now = new Date() } = {}) => {
  const expiredOrders = await Order.find({
    paymentStatus: { $in: ACTIVE_HOLD_PAYMENT_STATUSES },
    inventoryDecremented: true,
    checkoutHoldExpiresAt: { $lte: now },
  }).session(session);

  for (const order of expiredOrders) {
    await releaseOrderReservationsOnce({ order, session });
    order.status = 'cancelled';
    order.paymentStatus = 'payment_canceled';
    order.paymentFailureReason = 'checkout hold expired';
    order.checkoutHoldExpiresAt = null;
    await order.save({ session });
  }

  return expiredOrders.length;
};

const enforceActiveCheckoutHoldLimit = async ({ userId, session, now }) => {
  const activeHoldCount = await Order.countDocuments({
    user: userId,
    paymentStatus: { $in: ACTIVE_HOLD_PAYMENT_STATUSES },
    inventoryDecremented: true,
    checkoutHoldExpiresAt: { $gt: now },
  }).session(session);

  if (activeHoldCount >= CHECKOUT_HOLDS.maxActivePerUser) {
    throw createConflict('Too many unpaid checkout holds. Complete or cancel an existing checkout first.', [
      {
        code: 'CHECKOUT_HOLD_LIMIT_REACHED',
        resource: 'checkout',
        requested: activeHoldCount + 1,
        available: CHECKOUT_HOLDS.maxActivePerUser,
      },
    ]);
  }
};

export const createCheckoutFromCart = async ({
  userId,
  shippingAddress,
  shippingMethodId,
  notes,
  idempotencyKey,
  orderStatus = 'processing',
  paymentStatus,
  paymentProvider,
  hooks,
}) => {
  const key = validateIdempotencyKey(idempotencyKey);

  return mongoose.connection.transaction(async (session) => {
    const now = new Date();
    const checkoutHoldExpiresAt = new Date(now.getTime() + CHECKOUT_HOLDS.ttlMs);
    const shippingQuote = resolveShippingQuote({
      country: shippingAddress?.country,
      shippingMethodId,
    });
    const normalizedShippingAddress = {
      ...shippingAddress,
      country: shippingQuote.country,
    };

    await releaseExpiredCheckoutHolds({ session, now });

    const cart = await getCart(userId, session);
    const replay = await resolveExistingOrder({
      userId,
      idempotencyKey: key,
      cart,
      shippingAddress: normalizedShippingAddress,
      shippingMethodId: shippingQuote.id,
      notes,
      session,
    });

    if (replay) {
      return replay;
    }

    await enforceActiveCheckoutHoldLimit({ userId, session, now });

    if (!cart || cart.items.length === 0) {
      throw createBadRequest('Cart is empty');
    }

    const cartFingerprint = buildCheckoutFingerprint(cart, {
      shippingAddress: normalizedShippingAddress,
      shippingMethodId: shippingQuote.id,
      notes,
    });
    const { subtotal, discount, merchandiseTotal } = calculateTotals(cart);
    const total = roundMoney(merchandiseTotal + shippingQuote.price);

    await decrementStock(cart, session);
    await runHook(hooks, 'afterStockDecrement');

    await incrementCouponUsage(cart, subtotal, session);
    await runHook(hooks, 'afterCouponIncrement');

    const [order] = await Order.create(
      [
        {
          user: userId,
          items: buildOrderItems(cart),
          shippingAddress: normalizedShippingAddress,
          shippingMethod: shippingQuote.id,
          shippingMethodName: shippingQuote.name,
          shippingPrice: shippingQuote.price,
          shippingCountryCode: shippingQuote.countryCode,
          subtotal,
          discount,
          total,
          couponCode: cart.couponCode,
          status: orderStatus,
          paymentStatus,
          paymentProvider,
          checkoutHoldExpiresAt: ACTIVE_HOLD_PAYMENT_STATUSES.includes(paymentStatus)
            ? checkoutHoldExpiresAt
            : null,
          notes,
          idempotencyKey: key,
          cartFingerprint,
          inventoryDecremented: true,
        },
      ],
      { session }
    );
    await runHook(hooks, 'afterOrderCreate');

    cart.items = [];
    cart.couponCode = undefined;
    cart.discount = 0;
    await cart.save({ session });
    await runHook(hooks, 'afterCartClear');

    return {
      order,
      replayed: false,
      statusCode: 201,
    };
  });
};

export const compensateCheckoutSideEffects = async ({ userId, orderId }) =>
  mongoose.connection.transaction(async (session) => {
    const order = await Order.findOne({ _id: orderId, user: userId }).session(session);

    if (!order) {
      return { compensated: false };
    }

    await releaseOrderReservationsOnce({ order, session });

    let cart = await Cart.findOne({ user: userId }).session(session);

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    cart.items = order.items.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      size: item.size,
      priceAtAdd: item.price,
    }));
    cart.couponCode = order.couponCode || undefined;
    cart.discount = order.discount || 0;
    await cart.save({ session });

    order.inventoryDecremented = false;
    order.status = 'cancelled';
    order.paymentStatus = 'requires_payment';
    order.checkoutHoldExpiresAt = null;
    await order.save({ session });
    await Order.deleteOne({ _id: order._id }).session(session);

    return { compensated: true };
  });

export const createPaymentStartError = () =>
  createFailedDependency('Payment could not be started. Please try again.');

export const cancelOrderWithStockRestore = async ({ userId, orderId }) =>
  mongoose.connection.transaction(async (session) => {
    const order = await Order.findById(orderId).session(session);

    if (!order) {
      throw createNotFound('Order not found');
    }

    if (order.user.toString() !== userId.toString()) {
      throw createForbidden('Not authorized');
    }

    if (['shipped', 'delivered'].includes(order.status)) {
      throw createBadRequest('Cannot cancel order that has been shipped or delivered');
    }

    if (order.status === 'cancelled') {
      return { order, alreadyCancelled: true };
    }

    if (['paid', 'refunded', 'partially_refunded'].includes(order.paymentStatus)) {
      throw createBadRequest('Cannot cancel an order after payment has been captured');
    }

    if (!CANCELLABLE_PAYMENT_STATUSES.includes(order.paymentStatus)) {
      throw createBadRequest('Order cannot be cancelled in its current payment state');
    }

    if (!['pending', 'processing'].includes(order.status)) {
      throw createBadRequest('Order cannot be cancelled');
    }

    const shouldRestoreInventory = order.inventoryDecremented === true;
    const cancelledPaymentStatus = order.paymentProvider
      ? 'payment_canceled'
      : order.paymentStatus;
    const cancellationReason = order.paymentProvider
      ? 'customer cancelled checkout'
      : order.paymentFailureReason;
    const transition = await Order.updateOne(
      {
        _id: order._id,
        user: userId,
        status: { $in: ['pending', 'processing'] },
        paymentStatus: { $in: CANCELLABLE_PAYMENT_STATUSES },
      },
      {
        $set: {
          status: 'cancelled',
          paymentStatus: cancelledPaymentStatus,
          paymentFailureReason: cancellationReason,
          checkoutHoldExpiresAt: null,
        },
      },
      { session }
    );

    if (transition.modifiedCount !== 1) {
      const currentOrder = await Order.findById(orderId).session(session);

      if (['paid', 'refunded', 'partially_refunded'].includes(currentOrder?.paymentStatus)) {
        throw createBadRequest('Cannot cancel an order after payment has been captured');
      }

      return { order: currentOrder, alreadyCancelled: true };
    }

    if (shouldRestoreInventory) {
      await releaseOrderReservationsOnce({ order, session });
    }

    order.status = 'cancelled';
    order.paymentStatus = cancelledPaymentStatus;
    order.paymentFailureReason = cancellationReason;
    order.inventoryDecremented = false;
    order.checkoutHoldExpiresAt = null;
    return { order, alreadyCancelled: false };
  });
