import express from 'express';
import {
  getProducts,
  getProduct,
  getMenProducts,
  getWomenProducts,
  getSaleProducts,
  getBestsellers,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/men', getMenProducts);
router.get('/women', getWomenProducts);
router.get('/sale', getSaleProducts);
router.get('/bestsellers', getBestsellers);
router.get('/categories', getCategories);
router.get('/:id', getProduct);

// Admin routes
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

export default router;
