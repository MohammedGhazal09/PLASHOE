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
import { validateRequest } from '../middleware/validate.js';
import { createProductSchema, updateProductSchema } from '../validators/product.js';

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
router.post('/', protect, admin, validateRequest({ body: createProductSchema }), createProduct);
router.put('/:id', protect, admin, validateRequest({ body: updateProductSchema }), updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

export default router;
