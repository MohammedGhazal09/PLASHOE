import express from 'express';
import {
  getAdminReview,
  getAdminReviews,
  updateAdminReviewModeration,
} from '../controllers/reviewController.js';
import { admin, protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  reviewAdminListQuerySchema,
  reviewAdminParamsSchema,
  reviewModerationSchema,
} from '../validators/review.js';

const router = express.Router();

router.use(protect, admin);

router.get('/', validateRequest({ query: reviewAdminListQuerySchema }), getAdminReviews);
router.get('/:id', validateRequest({ params: reviewAdminParamsSchema }), getAdminReview);
router.patch(
  '/:id/moderation',
  validateRequest({ params: reviewAdminParamsSchema, body: reviewModerationSchema }),
  updateAdminReviewModeration
);

export default router;
