import express from 'express';
import {
  createBackInStockRequest,
  getAdminBackInStockRequests,
  getAdminBackInStockSummary,
  updateAdminBackInStockStatus,
} from '../controllers/backInStockController.js';
import { admin, protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  backInStockAdminListQuerySchema,
  backInStockCreateSchema,
  backInStockParamsSchema,
  backInStockStatusUpdateSchema,
} from '../validators/backInStock.js';

const router = express.Router();

router.get(
  '/admin',
  protect,
  admin,
  validateRequest({ query: backInStockAdminListQuerySchema }),
  getAdminBackInStockRequests
);
router.get('/admin/summary', protect, admin, getAdminBackInStockSummary);
router.patch(
  '/admin/:id/status',
  protect,
  admin,
  validateRequest({ params: backInStockParamsSchema, body: backInStockStatusUpdateSchema }),
  updateAdminBackInStockStatus
);
router.post('/', validateRequest({ body: backInStockCreateSchema }), createBackInStockRequest);

export default router;
