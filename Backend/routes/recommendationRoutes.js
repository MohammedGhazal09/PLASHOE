import express from 'express';
import { getRecommendations } from '../controllers/recommendationController.js';
import { validateRequest } from '../middleware/validate.js';
import { recommendationQuerySchema } from '../validators/recommendation.js';

const router = express.Router();

router.get('/', validateRequest({ query: recommendationQuerySchema }), getRecommendations);

export default router;

