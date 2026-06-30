import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import {
  cancelOrderWithStockRestore,
  getShippingOptionsForCart,
} from '../services/checkoutService.js';
import { completeMockPayment, startCheckoutPayment } from '../services/paymentService.js';

const toIdString = (value) => {
  if (!value) return '';
  if (value._id) return value._id.toString();
  return value.toString();
};

const reorderConflict = ({ code, productId, orderItemId, requested, available, message }) => ({
  code,
  resource: 'product',
  productId,
  orderItemId,
  requested,
  available,
  message,
});

// @desc    Create order from cart (checkout)
// @route   POST /api/orders
export const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, shippingMethodId, notes } = req.body;
    const idempotencyKey = req.get('Idempotency-Key');

    const result = await startCheckoutPayment({
      user: req.user,
      shippingAddress,
      shippingMethodId,
      notes,
      idempotencyKey
    });

    res.status(result.statusCode).json({
      success: true,
      message: result.replayed ? 'Payment already started' : 'Payment started',
      data: {
        order: result.order,
        payment: result.payment
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get eligible shipping options for the current checkout cart
// @route   POST /api/orders/shipping-options
export const getShippingOptions = async (req, res, next) => {
  try {
    const options = await getShippingOptionsForCart({
      userId: req.user._id,
      country: req.body.country,
    });

    res.json({
      success: true,
      data: options,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's orders
// @route   GET /api/orders
export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Make sure user owns order
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
export const cancelOrder = async (req, res, next) => {
  try {
    const { order } = await cancelOrderWithStockRestore({
      userId: req.user._id,
      orderId: req.params.id
    });

    res.json({
      success: true,
      message: 'Order cancelled',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete a sandbox/mock payment outcome
// @route   POST /api/orders/:id/payment/mock
export const completeMockOrderPayment = async (req, res, next) => {
  try {
    const order = await completeMockPayment({
      user: req.user,
      orderId: req.params.id,
      outcome: req.body.outcome,
    });

    res.json({
      success: true,
      message: `Mock payment ${req.body.outcome} recorded`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rebuild cart from a previous order using current catalog data
// @route   POST /api/orders/:id/reorder
export const reorderOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const productIds = order.items.map((item) => toIdString(item.product)).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } });
    const productsById = new Map(products.map((product) => [product._id.toString(), product]));
    const conflicts = [];
    let added = 0;

    for (const item of order.items) {
      const productId = toIdString(item.product);
      const quantity = Number(item.quantity || 1);
      const size = Number(item.size);
      const product = productsById.get(productId);
      const orderItemId = item._id?.toString();

      if (!product) {
        conflicts.push(
          reorderConflict({
            code: 'PRODUCT_UNAVAILABLE',
            productId,
            orderItemId,
            requested: quantity,
            available: 0,
            message: 'Product is no longer available',
          })
        );
        continue;
      }

      if (!product.sizes.includes(size)) {
        conflicts.push(
          reorderConflict({
            code: 'SIZE_UNAVAILABLE',
            productId,
            orderItemId,
            requested: quantity,
            available: product.stock,
            message: 'Requested size is no longer available',
          })
        );
        continue;
      }

      const existingItem = cart.items.find(
        (cartItem) => toIdString(cartItem.product) === productId && Number(cartItem.size) === size
      );
      const finalQuantity = (existingItem?.quantity || 0) + quantity;

      if (finalQuantity > product.stock) {
        conflicts.push(
          reorderConflict({
            code: 'INSUFFICIENT_STOCK',
            productId,
            orderItemId,
            requested: finalQuantity,
            available: product.stock,
            message: 'Requested quantity exceeds available stock',
          })
        );
        continue;
      }

      if (existingItem) {
        existingItem.quantity = finalQuantity;
        existingItem.priceAtAdd = product.price.current;
      } else {
        cart.items.push({
          product: product._id,
          quantity,
          size,
          priceAtAdd: product.price.current,
        });
      }

      added += quantity;
    }

    if (added === 0) {
      return res.status(409).json({
        success: false,
        message: 'No order items are currently available to reorder',
        errors: conflicts,
      });
    }

    await cart.save();
    await cart.populate('items.product', 'name image price');

    res.json({
      success: true,
      message: 'Order items moved to cart',
      data: {
        cart,
        added,
        skipped: conflicts,
      },
    });
  } catch (error) {
    next(error);
  }
};
