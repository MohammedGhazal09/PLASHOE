import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  addAddress,
  deleteAddress
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/addresses', protect, addAddress);
router.delete('/addresses/:id', protect, deleteAddress);

export default router;
