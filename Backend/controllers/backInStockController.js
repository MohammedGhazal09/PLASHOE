import BackInStockRequest from '../models/BackInStockRequest.js';
import Product from '../models/Product.js';
import {
  buildPagination,
  buildPaginationEnvelope,
  escapeRegex,
} from '../utils/adminListQuery.js';

const backInStockConflict = (message, code, product) => ({
  success: false,
  message,
  errors: [
    {
      code,
      resource: 'product',
      productId: product._id.toString(),
      available: product.stock,
    },
  ],
});

const toCountMap = (rows) =>
  rows.reduce((acc, row) => {
    acc[row._id || 'unknown'] = row.count;
    return acc;
  }, {});

const buildAdminFilter = async (query) => {
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.productId) {
    filter.product = query.productId;
  }

  if (query.size) {
    filter.size = query.size;
  }

  if (query.email) {
    filter.email = new RegExp(escapeRegex(query.email), 'i');
  }

  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q), 'i');
    const products = await Product.find({ name: pattern }).select('_id').lean();
    const clauses = [{ email: pattern }];

    if (products.length > 0) {
      clauses.push({ product: { $in: products.map((product) => product._id) } });
    }

    filter.$or = clauses;
  }

  return filter;
};

// @desc    Capture back-in-stock notification intent
// @route   POST /api/back-in-stock
export const createBackInStockRequest = async (req, res, next) => {
  try {
    const { productId, size, email, consent } = req.body;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (!product.sizes.includes(size)) {
      return res.status(400).json({
        success: false,
        message: 'Requested size is not available for this product',
      });
    }

    if (product.stock > 0) {
      return res.status(409).json(
        backInStockConflict('Product is currently available', 'PRODUCT_AVAILABLE', product)
      );
    }

    const existing = await BackInStockRequest.findOne({
      product: product._id,
      size,
      email,
      status: 'pending',
    });

    if (existing) {
      return res.json({
        success: true,
        message: 'Back-in-stock request already exists',
        data: existing,
      });
    }

    const request = await BackInStockRequest.create({
      product: product._id,
      size,
      email,
      consent,
    });

    res.status(201).json({
      success: true,
      message: 'Back-in-stock request saved',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get back-in-stock demand summary for admins
// @route   GET /api/back-in-stock/admin/summary
export const getAdminBackInStockSummary = async (req, res, next) => {
  try {
    const [totalCount, statusRows, pendingBySizeRows, topDemand] = await Promise.all([
      BackInStockRequest.countDocuments(),
      BackInStockRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      BackInStockRequest.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: '$size', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      BackInStockRequest.aggregate([
        { $match: { status: 'pending' } },
        {
          $group: {
            _id: { product: '$product', size: '$size' },
            pendingCount: { $sum: 1 },
            emails: { $addToSet: '$email' },
            oldestRequestedAt: { $min: '$requestedAt' },
            latestRequestedAt: { $max: '$requestedAt' },
          },
        },
        { $sort: { pendingCount: -1, latestRequestedAt: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id.product',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            product: {
              _id: '$_id.product',
              name: { $ifNull: ['$product.name', 'Deleted product'] },
              category: '$product.category',
              stock: '$product.stock',
            },
            size: '$_id.size',
            pendingCount: 1,
            emailCount: { $size: '$emails' },
            oldestRequestedAt: 1,
            latestRequestedAt: 1,
          },
        },
      ]),
    ]);

    const statusCounts = toCountMap(statusRows);
    const pendingBySize = pendingBySizeRows.map((row) => ({
      size: row._id,
      count: row.count,
    }));

    res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        totalCount,
        pendingCount: statusCounts.pending || 0,
        statusCounts,
        pendingBySize,
        topDemand,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List back-in-stock requests for admins
// @route   GET /api/back-in-stock/admin
export const getAdminBackInStockRequests = async (req, res, next) => {
  try {
    const query = req.validated?.query || req.query;
    const { page, limit, skip } = buildPagination(query);
    const filter = await buildAdminFilter(query);

    const [total, requests] = await Promise.all([
      BackInStockRequest.countDocuments(filter),
      BackInStockRequest.find(filter)
        .populate('product', 'name category image stock sizes')
        .sort({ requestedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.json(buildPaginationEnvelope({ total, page, limit, data: requests }));
  } catch (error) {
    next(error);
  }
};

// @desc    Update back-in-stock request status without sending notifications
// @route   PATCH /api/back-in-stock/admin/:id/status
export const updateAdminBackInStockStatus = async (req, res, next) => {
  try {
    const request = await BackInStockRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Back-in-stock request not found',
      });
    }

    request.status = req.body.status;
    request.notifiedAt = req.body.status === 'notified' ? new Date() : null;
    await request.save();
    await request.populate('product', 'name category image stock sizes');

    res.json({
      success: true,
      message:
        req.body.status === 'notified'
          ? 'Back-in-stock request marked notified'
          : 'Back-in-stock request cancelled',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};
