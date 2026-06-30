import express from 'express';
import { handlePayPalWebhook, handleStripeWebhook } from '../controllers/webhookController.js';

const router = express.Router();

router.post('/stripe', handleStripeWebhook);
router.post('/paypal', handlePayPalWebhook);

export default router;
