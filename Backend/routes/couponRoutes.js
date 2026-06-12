import express from 'express';
import {
  validateCoupon,
  createCoupon,
  getCoupons,
  deleteCoupon
} from '../controllers/couponController.js';
import { protect, admin } from '../middleware/auth.js';
import { couponValidationLimiter } from '../middleware/security.js';
import { validateRequest } from '../middleware/validate.js';
import {
  couponCreateSchema,
  couponParamsSchema,
  couponValidationSchema,
} from '../validators/coupon.js';

const router = express.Router();

// Public route
router.post(
  '/validate',
  couponValidationLimiter,
  validateRequest({ body: couponValidationSchema }),
  validateCoupon
);

// Admin routes
router.get('/', protect, admin, getCoupons);
router.post('/', protect, admin, validateRequest({ body: couponCreateSchema }), createCoupon);
router.delete('/:id', protect, admin, validateRequest({ params: couponParamsSchema }), deleteCoupon);

export default router;
