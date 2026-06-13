import Order from '../models/Order.js';
import User from '../models/User.js';
import { advanceOrderFulfillment } from '../services/fulfillmentService.js';
import {
  buildDateRangeFilter,
  buildPagination,
  buildPaginationEnvelope,
  escapeRegex,
} from '../utils/adminListQuery.js';

const toCompactOrderRow = (order) => ({
  _id: order._id,
  orderNumber: order.orderNumber,
  user: order.user
    ? {
        _id: order.user._id,
        name: order.user.name,
        email: order.user.email,
      }
    : null,
  status: order.status,
  paymentStatus: order.paymentStatus,
  total: order.total,
  itemCount: (order.items || []).reduce((total, item) => total + (item.quantity || 0), 0),
  trackingNumber: order.trackingNumber,
  carrier: order.carrier,
  estimatedDeliveryDate: order.estimatedDeliveryDate,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

const buildAdminOrderFilter = async ({
  status,
  paymentStatus,
  q,
  createdFrom,
  createdTo,
}) => {
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  }

  const createdAt = buildDateRangeFilter({ from: createdFrom, to: createdTo });
  if (createdAt) {
    filter.createdAt = createdAt;
  }

  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    const users = await User.find({
      $or: [{ name: pattern }, { email: pattern }],
    })
      .select('_id')
      .lean();

    filter.$or = [
      { orderNumber: pattern },
      ...(
        users.length > 0
          ? [{ user: { $in: users.map((user) => user._id) } }]
          : []
      ),
    ];
  }

  return filter;
};

export const listAdminOrders = async (req, res, next) => {
  try {
    const query = req.validated?.query || req.query;
    const { page, limit, skip } = buildPagination(query);
    const filter = await buildAdminOrderFilter(query);

    const [total, orders] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email'),
    ]);

    res.json(
      buildPaginationEnvelope({
        total,
        page,
        limit,
        data: orders.map(toCompactOrderRow),
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getAdminOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminOrderFulfillment = async (req, res, next) => {
  try {
    const { order, message } = await advanceOrderFulfillment({
      orderId: req.params.id,
      updates: req.body,
    });

    await order.populate('user', 'name email');

    res.json({
      success: true,
      message,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
