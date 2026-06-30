import express from 'express';
import { getAdminSummary } from '../controllers/adminSummaryController.js';
import { admin, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, admin);

router.get('/', getAdminSummary);

export default router;
