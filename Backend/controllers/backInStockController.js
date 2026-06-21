import BackInStockRequest from '../models/BackInStockRequest.js';
import Product from '../models/Product.js';

const backInStockConflict = (message, code, product) => ({
  success: false,
  message,
  errors: [
    {
      code,
      resource: 'product',
      productId: product._id.toString(),
      available: product.stock,
    },
  ],
});

// @desc    Capture back-in-stock notification intent
// @route   POST /api/back-in-stock
export const createBackInStockRequest = async (req, res, next) => {
  try {
    const { productId, size, email, consent } = req.body;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (!product.sizes.includes(size)) {
      return res.status(400).json({
        success: false,
        message: 'Requested size is not available for this product',
      });
    }

    if (product.stock > 0) {
      return res.status(409).json(
        backInStockConflict('Product is currently available', 'PRODUCT_AVAILABLE', product)
      );
    }

    const existing = await BackInStockRequest.findOne({
      product: product._id,
      size,
      email,
      status: 'pending',
    });

    if (existing) {
      return res.json({
        success: true,
        message: 'Back-in-stock request already exists',
        data: existing,
      });
    }

    const request = await BackInStockRequest.create({
      product: product._id,
      size,
      email,
      consent,
    });

    res.status(201).json({
      success: true,
      message: 'Back-in-stock request saved',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

