import express from 'express';
import {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder,
  reorderOrder
} from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { createOrderSchema, orderParamsSchema } from '../validators/order.js';

const router = express.Router();

// All order routes require authentication
router.use(protect);

router.post('/', validateRequest({ body: createOrderSchema }), createOrder);
router.get('/', getOrders);
router.post('/:id/reorder', validateRequest({ params: orderParamsSchema }), reorderOrder);
router.get('/:id', validateRequest({ params: orderParamsSchema }), getOrder);
router.put('/:id/cancel', validateRequest({ params: orderParamsSchema }), cancelOrder);

export default router;
