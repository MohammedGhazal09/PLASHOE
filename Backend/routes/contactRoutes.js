import express from 'express';
import {
  submitContact,
  getMessages,
  markAsRead,
  deleteMessage
} from '../controllers/contactController.js';
import { protect, admin } from '../middleware/auth.js';
import { contactLimiter } from '../middleware/security.js';

const router = express.Router();

// Public route
router.post('/', contactLimiter, submitContact);

// Admin routes
router.get('/', protect, admin, getMessages);
router.put('/:id/read', protect, admin, markAsRead);
router.delete('/:id', protect, admin, deleteMessage);

export default router;
