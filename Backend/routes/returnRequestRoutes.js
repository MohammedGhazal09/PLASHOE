import express from 'express';
import {
  createReturnRequest,
  getReturnRequest,
  listReturnRequests,
} from '../controllers/returnRequestController.js';
import { protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  createReturnRequestSchema,
  returnRequestListQuerySchema,
  returnRequestParamsSchema,
} from '../validators/returnRequest.js';

const router = express.Router();

router.use(protect);

router.post('/', validateRequest({ body: createReturnRequestSchema }), createReturnRequest);
router.get('/', validateRequest({ query: returnRequestListQuerySchema }), listReturnRequests);
router.get('/:id', validateRequest({ params: returnRequestParamsSchema }), getReturnRequest);

export default router;
