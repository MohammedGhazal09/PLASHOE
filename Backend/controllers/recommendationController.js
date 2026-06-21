import Product from '../models/Product.js';

const productToRecommendation = (product, reason) => ({
  ...product.toObject({ virtuals: true }),
  recommendationReason: reason,
});

const pushRecommendations = ({ target, products, seen, limit, reason }) => {
  for (const product of products) {
    const id = product._id.toString();
    if (target.length >= limit) break;
    if (seen.has(id)) continue;

    seen.add(id);
    target.push(productToRecommendation(product, reason));
  }
};

// @desc    Get bounded explainable product recommendations
// @route   GET /api/recommendations
export const getRecommendations = async (req, res, next) => {
  try {
    const { productId, limit = 4 } = req.query;
    const recommendations = [];
    const seen = new Set();
    const baseQuery = { stock: { $gt: 0 } };
    const sort = { rating: -1, createdAt: -1 };

    if (productId) {
      const sourceProduct = await Product.findById(productId);

      if (!sourceProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      seen.add(sourceProduct._id.toString());

      const sameGenderCategory = await Product.find({
        ...baseQuery,
        gender: sourceProduct.gender,
        category: sourceProduct.category,
        _id: { $ne: sourceProduct._id },
      }).sort(sort).limit(limit * 2);
      pushRecommendations({
        target: recommendations,
        products: sameGenderCategory,
        seen,
        limit,
        reason: `Similar ${sourceProduct.category.toLowerCase()} styles`,
      });

      if (recommendations.length < limit) {
        const sameCategory = await Product.find({
          ...baseQuery,
          category: sourceProduct.category,
          _id: { $ne: sourceProduct._id },
        }).sort(sort).limit(limit * 2);
        pushRecommendations({
          target: recommendations,
          products: sameCategory,
          seen,
          limit,
          reason: `Popular ${sourceProduct.category.toLowerCase()} picks`,
        });
      }
    }

    if (recommendations.length < limit) {
      const topRated = await Product.find(baseQuery).sort(sort).limit(limit * 2);
      pushRecommendations({
        target: recommendations,
        products: topRated,
        seen,
        limit,
        reason: 'Top-rated available style',
      });
    }

    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (error) {
    next(error);
  }
};

