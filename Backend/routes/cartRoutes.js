import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon
} from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  addCartItemSchema,
  cartCouponSchema,
  cartItemParamsSchema,
  updateCartItemSchema,
} from '../validators/cart.js';

const router = express.Router();

// All cart routes require authentication
router.use(protect);

router.get('/', getCart);
router.post('/items', validateRequest({ body: addCartItemSchema }), addToCart);
router.put(
  '/items/:itemId',
  validateRequest({ params: cartItemParamsSchema, body: updateCartItemSchema }),
  updateCartItem
);
router.delete('/items/:itemId', validateRequest({ params: cartItemParamsSchema }), removeFromCart);
router.delete('/', clearCart);
router.post('/coupon', validateRequest({ body: cartCouponSchema }), applyCoupon);
router.delete('/coupon', removeCoupon);

export default router;
