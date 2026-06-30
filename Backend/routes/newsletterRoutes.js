import express from 'express';
import {
  getNewsletterSubscriptions,
  getNewsletterSummary,
  subscribeNewsletter,
  unsubscribeNewsletter,
} from '../controllers/newsletterController.js';
import { admin, protect } from '../middleware/auth.js';
import { newsletterLimiter } from '../middleware/security.js';
import { validateRequest } from '../middleware/validate.js';
import {
  newsletterAdminListQuerySchema,
  newsletterSubscribeSchema,
  newsletterUnsubscribeParamsSchema,
} from '../validators/newsletter.js';

const router = express.Router();

router.post('/', newsletterLimiter, validateRequest({ body: newsletterSubscribeSchema }), subscribeNewsletter);
router.post(
  '/unsubscribe/:token',
  validateRequest({ params: newsletterUnsubscribeParamsSchema }),
  unsubscribeNewsletter
);

router.get('/admin/summary', protect, admin, getNewsletterSummary);
router.get(
  '/admin',
  protect,
  admin,
  validateRequest({ query: newsletterAdminListQuerySchema }),
  getNewsletterSubscriptions
);

export default router;
