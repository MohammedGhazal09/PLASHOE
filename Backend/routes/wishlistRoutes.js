import express from 'express';
import {
  addWishlistItem,
  getWishlist,
  removeWishlistItem,
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  wishlistItemBodySchema,
  wishlistItemParamsSchema,
  wishlistListQuerySchema,
} from '../validators/wishlist.js';

const router = express.Router();

router.use(protect);

router.get('/', validateRequest({ query: wishlistListQuerySchema }), getWishlist);
router.post('/items', validateRequest({ body: wishlistItemBodySchema }), addWishlistItem);
router.delete(
  '/items/:productId',
  validateRequest({ params: wishlistItemParamsSchema }),
  removeWishlistItem
);

export default router;

