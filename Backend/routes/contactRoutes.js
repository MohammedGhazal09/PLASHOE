import express from 'express';
import {
  submitContact,
  getMessages,
  markAsRead,
  deleteMessage
} from '../controllers/contactController.js';
import { protect, admin } from '../middleware/auth.js';
import { contactLimiter } from '../middleware/security.js';
import { validateRequest } from '../middleware/validate.js';
import { contactParamsSchema, contactSubmissionSchema } from '../validators/contact.js';

const router = express.Router();

// Public route
router.post('/', contactLimiter, validateRequest({ body: contactSubmissionSchema }), submitContact);

// Admin routes
router.get('/', protect, admin, getMessages);
router.put('/:id/read', protect, admin, validateRequest({ params: contactParamsSchema }), markAsRead);
router.delete('/:id', protect, admin, validateRequest({ params: contactParamsSchema }), deleteMessage);

export default router;
