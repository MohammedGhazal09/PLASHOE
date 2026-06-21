import express from 'express';
import { createBackInStockRequest } from '../controllers/backInStockController.js';
import { validateRequest } from '../middleware/validate.js';
import { backInStockCreateSchema } from '../validators/backInStock.js';

const router = express.Router();

router.post('/', validateRequest({ body: backInStockCreateSchema }), createBackInStockRequest);

export default router;

