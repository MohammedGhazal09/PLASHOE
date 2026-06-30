import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  addAddress,
  setDefaultAddress,
  deleteAddress
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';
import { validateRequest } from '../middleware/validate.js';
import {
  addressParamsSchema,
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
router.put('/addresses/:id/default', protect, validateRequest({ params: addressParamsSchema }), setDefaultAddress);
router.delete('/addresses/:id', protect, validateRequest({ params: addressParamsSchema }), deleteAddress);

export default router;
