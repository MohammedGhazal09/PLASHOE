import Coupon from '../models/Coupon.js';
import {
  buildPagination,
  buildPaginationEnvelope,
  escapeRegex,
} from '../utils/adminListQuery.js';

// @desc    Validate coupon code
// @route   POST /api/coupons/validate
export const validateCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    if (!coupon.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Coupon is not valid or has expired'
      });
    }

    res.json({
      success: true,
      data: {
        code: coupon.code,
        discountPercentage: coupon.discountPercentage,
        minOrderAmount: coupon.minOrderAmount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create coupon (admin)
// @route   POST /api/coupons
export const createCoupon = async (req, res, next) => {
  try {
    const couponData = req.body;
    const coupon = await Coupon.create(couponData);
    res.status(201).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all coupons (admin)
// @route   GET /api/coupons
export const getCoupons = async (req, res, next) => {
  try {
    const query = req.validated?.query || req.query;
    const { page, limit, skip } = buildPagination(query);
    const filter = {};

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.q) {
      filter.code = new RegExp(escapeRegex(query.q), 'i');
    }

    if (query.validFrom) {
      filter.validFrom = { $gte: query.validFrom };
    }

    if (query.validUntil) {
      filter.validUntil = { $lte: query.validUntil };
    }

    const [total, coupons] = await Promise.all([
      Coupon.countDocuments(filter),
      Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    res.json(buildPaginationEnvelope({ total, page, limit, data: coupons }));
  } catch (error) {
    next(error);
  }
};

// @desc    Delete coupon (admin)
// @route   DELETE /api/coupons/:id
export const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.json({
      success: true,
      message: 'Coupon deleted'
    });
  } catch (error) {
    next(error);
  }
};
