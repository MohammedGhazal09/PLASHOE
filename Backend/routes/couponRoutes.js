import express from 'express';
import {
  validateCoupon,
  createCoupon,
  getCoupons,
  deleteCoupon
} from '../controllers/couponController.js';
import { protect, admin } from '../middleware/auth.js';
import { couponValidationLimiter } from '../middleware/security.js';

const router = express.Router();

// Public route
router.post('/validate', couponValidationLimiter, validateCoupon);

// Admin routes
router.get('/', protect, admin, getCoupons);
router.post('/', protect, admin, createCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

export default router;
