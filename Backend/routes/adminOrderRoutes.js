import express from 'express';
import {
  getAdminOrder,
  listAdminOrders,
  updateAdminOrderFulfillment,
} from '../controllers/adminOrderController.js';
import { protect, admin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  adminFulfillmentUpdateSchema,
  adminOrderListQuerySchema,
  adminOrderParamsSchema,
} from '../validators/adminOrder.js';

const router = express.Router();

router.use(protect, admin);

router.get('/', validateRequest({ query: adminOrderListQuerySchema }), listAdminOrders);
router.patch(
  '/:id/fulfillment',
  validateRequest({
    params: adminOrderParamsSchema,
    body: adminFulfillmentUpdateSchema,
  }),
  updateAdminOrderFulfillment
);
router.get('/:id', validateRequest({ params: adminOrderParamsSchema }), getAdminOrder);

export default router;
