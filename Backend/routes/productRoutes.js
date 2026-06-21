import express from 'express';
import {
  getProducts,
  getProduct,
  getMenProducts,
  getWomenProducts,
  getSaleProducts,
  getBestsellers,
  getCategories,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import {
  createProductReview,
  getProductReviews,
} from '../controllers/reviewController.js';
import { protect, admin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  createProductSchema,
  productParamsSchema,
  productQuerySchema,
  relatedProductsQuerySchema,
  updateProductSchema,
} from '../validators/product.js';
import {
  reviewCreateSchema,
  reviewListQuerySchema,
  reviewParamsSchema,
} from '../validators/review.js';

const router = express.Router();

// Public routes
router.get('/', validateRequest({ query: productQuerySchema }), getProducts);
router.get('/men', validateRequest({ query: productQuerySchema }), getMenProducts);
router.get('/women', validateRequest({ query: productQuerySchema }), getWomenProducts);
router.get('/sale', validateRequest({ query: productQuerySchema }), getSaleProducts);
router.get('/bestsellers', getBestsellers);
router.get('/categories', getCategories);
router.get(
  '/:id/related',
  validateRequest({ params: productParamsSchema, query: relatedProductsQuerySchema }),
  getRelatedProducts
);
router.get(
  '/:id/reviews',
  validateRequest({ params: reviewParamsSchema, query: reviewListQuerySchema }),
  getProductReviews
);
router.post(
  '/:id/reviews',
  protect,
  validateRequest({ params: reviewParamsSchema, body: reviewCreateSchema }),
  createProductReview
);
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
