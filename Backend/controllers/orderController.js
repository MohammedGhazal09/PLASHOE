import Order from '../models/Order.js';
import {
  cancelOrderWithStockRestore,
} from '../services/checkoutService.js';
import { startCheckoutPayment } from '../services/paymentService.js';

// @desc    Create order from cart (checkout)
// @route   POST /api/orders
export const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, notes } = req.body;
    const idempotencyKey = req.get('Idempotency-Key');

    const result = await startCheckoutPayment({
      user: req.user,
      shippingAddress,
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
