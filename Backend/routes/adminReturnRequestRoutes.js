import express from 'express';
import {
  getAdminReturnRequest,
  listAdminReturnRequests,
  updateAdminReturnRequestStatus,
} from '../controllers/returnRequestController.js';
import { admin, protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  adminReturnRequestListQuerySchema,
  adminReturnStatusUpdateSchema,
  returnRequestParamsSchema,
} from '../validators/returnRequest.js';

const router = express.Router();

router.use(protect, admin);

router.get('/', validateRequest({ query: adminReturnRequestListQuerySchema }), listAdminReturnRequests);
router.get('/:id', validateRequest({ params: returnRequestParamsSchema }), getAdminReturnRequest);
router.patch(
  '/:id/status',
  validateRequest({
    params: returnRequestParamsSchema,
    body: adminReturnStatusUpdateSchema,
  }),
  updateAdminReturnRequestStatus
);

export default router;
