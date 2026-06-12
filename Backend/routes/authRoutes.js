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
import { validateRequest } from '../middleware/validate.js';
import {
  addressSchema,
  loginSchema,
  profileSchema,
  registerSchema,
} from '../validators/auth.js';

const router = express.Router();

router.post('/register', authLimiter, validateRequest({ body: registerSchema }), register);
router.post('/login', authLimiter, validateRequest({ body: loginSchema }), login);
router.get('/me', protect, getMe);
router.put('/profile', protect, validateRequest({ body: profileSchema }), updateProfile);
router.post('/addresses', protect, validateRequest({ body: addressSchema }), addAddress);
router.delete('/addresses/:id', protect, deleteAddress);

export default router;
