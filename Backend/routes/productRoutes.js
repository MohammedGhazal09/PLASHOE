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
import {
  createProductSchema,
  productParamsSchema,
  productQuerySchema,
  updateProductSchema,
} from '../validators/product.js';

const router = express.Router();

// Public routes
router.get('/', validateRequest({ query: productQuerySchema }), getProducts);
router.get('/men', validateRequest({ query: productQuerySchema }), getMenProducts);
router.get('/women', validateRequest({ query: productQuerySchema }), getWomenProducts);
router.get('/sale', validateRequest({ query: productQuerySchema }), getSaleProducts);
router.get('/bestsellers', getBestsellers);
router.get('/categories', getCategories);
router.get('/:id', validateRequest({ params: productParamsSchema }), getProduct);

// Admin routes
router.post('/', protect, admin, validateRequest({ body: createProductSchema }), createProduct);
router.put(
  '/:id',
  protect,
  admin,
  validateRequest({ params: productParamsSchema, body: updateProductSchema }),
  updateProduct
);
router.delete('/:id', protect, admin, validateRequest({ params: productParamsSchema }), deleteProduct);

export default router;
