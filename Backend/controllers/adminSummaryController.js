import ContactMessage from '../models/ContactMessage.js';
import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import ReturnRequest from '../models/ReturnRequest.js';

const LOW_STOCK_THRESHOLD = 5;
const OPEN_RETURN_STATUSES = ['requested', 'approved', 'received'];

const toCountMap = (rows) =>
  rows.reduce((acc, row) => {
    acc[row._id || 'unknown'] = row.count;
    return acc;
  }, {});

const countByField = async (Model, field, match = {}) => {
  const rows = await Model.aggregate([
    { $match: match },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  return toCountMap(rows);
};

// @desc    Get compact admin store summary
// @route   GET /api/admin/summary
export const getAdminSummary = async (req, res, next) => {
  try {
    const [
      revenueRows,
      totalOrders,
      ordersByStatus,
      paymentsByStatus,
      productCount,
      lowStockCount,
      outOfStockCount,
      lowStockProducts,
      openReturnsCount,
      returnsByStatus,
      unreadMessagesCount,
      couponRows,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        {
          $group: {
            _id: null,
            paidTotal: { $sum: '$total' },
            paidOrderCount: { $sum: 1 },
          },
        },
      ]),
      Order.countDocuments(),
      countByField(Order, 'status'),
      countByField(Order, 'paymentStatus'),
      Product.countDocuments(),
      Product.countDocuments({ stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } }),
      Product.countDocuments({ stock: { $lte: 0 } }),
      Product.find({ stock: { $lte: LOW_STOCK_THRESHOLD } })
        .sort({ stock: 1, name: 1 })
        .limit(5)
        .select('name category stock')
        .lean(),
      ReturnRequest.countDocuments({ status: { $in: OPEN_RETURN_STATUSES } }),
      countByField(ReturnRequest, 'status'),
      ContactMessage.countDocuments({ isRead: false }),
      Coupon.aggregate([
        {
          $group: {
            _id: null,
            activeCount: { $sum: { $cond: ['$isActive', 1, 0] } },
            totalRedemptions: { $sum: '$usedCount' },
          },
        },
      ]),
    ]);

    const revenue = revenueRows[0] || { paidTotal: 0, paidOrderCount: 0 };
    const couponUsage = couponRows[0] || { activeCount: 0, totalRedemptions: 0 };

    res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        revenue: {
          paidTotal: revenue.paidTotal || 0,
          paidOrderCount: revenue.paidOrderCount || 0,
          averagePaidOrderValue: revenue.paidOrderCount
            ? (revenue.paidTotal || 0) / revenue.paidOrderCount
            : 0,
        },
        orders: {
          total: totalOrders,
          byStatus: ordersByStatus,
          paymentsByStatus,
        },
        inventory: {
          productCount,
          lowStockThreshold: LOW_STOCK_THRESHOLD,
          lowStockCount,
          outOfStockCount,
          lowStockProducts,
        },
        returns: {
          openCount: openReturnsCount,
          byStatus: returnsByStatus,
        },
        messages: {
          unreadCount: unreadMessagesCount,
        },
        coupons: {
          activeCount: couponUsage.activeCount || 0,
          totalRedemptions: couponUsage.totalRedemptions || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
