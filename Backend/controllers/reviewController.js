import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';

const emptyRatingDistribution = () => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

const fitSummaryFrom = (reviews) => {
  const counts = {
    runsSmall: 0,
    trueToSize: 0,
    runsLarge: 0,
  };

  reviews.forEach((review) => {
    if (review.fit === 'runs_small') counts.runsSmall += 1;
    if (review.fit === 'true_to_size') counts.trueToSize += 1;
    if (review.fit === 'runs_large') counts.runsLarge += 1;
  });

  const total = counts.runsSmall + counts.trueToSize + counts.runsLarge;
  const entries = [
    ['runs_small', counts.runsSmall],
    ['true_to_size', counts.trueToSize],
    ['runs_large', counts.runsLarge],
  ];
  const [dominant, dominantCount] = entries.sort((a, b) => b[1] - a[1])[0];

  return {
    ...counts,
    total,
    dominant: dominantCount > 0 ? dominant : null,
  };
};

const reviewSummaryFromProduct = (product) => ({
  averageRating: product.rating || 0,
  reviewCount: product.reviewCount || 0,
  ratingDistribution: product.ratingDistribution || emptyRatingDistribution(),
  fitSummary: product.fitSummary || {
    runsSmall: 0,
    trueToSize: 0,
    runsLarge: 0,
    total: 0,
    dominant: null,
  },
});

const toPublicReview = (review) => ({
  _id: review._id,
  rating: review.rating,
  title: review.title,
  comment: review.comment,
  fit: review.fit,
  verifiedPurchase: review.verifiedPurchase,
  createdAt: review.createdAt,
  user: {
    name: review.user?.name || 'PLASHOE customer',
  },
});

export const updateProductReviewAggregates = async (productId) => {
  const reviews = await Review.find({ product: productId, isApproved: true });
  const distribution = emptyRatingDistribution();
  let ratingTotal = 0;

  reviews.forEach((review) => {
    distribution[review.rating] += 1;
    ratingTotal += review.rating;
  });

  const reviewCount = reviews.length;
  const rating = reviewCount > 0 ? Math.round((ratingTotal / reviewCount) * 10) / 10 : 0;
  const fitSummary = fitSummaryFrom(reviews);

  return Product.findByIdAndUpdate(
    productId,
    {
      rating,
      reviewCount,
      ratingDistribution: distribution,
      fitSummary,
    },
    { new: true, runValidators: true }
  );
};

const hasVerifiedPurchase = async ({ userId, productId }) =>
  Boolean(
    await Order.exists({
      user: userId,
      status: { $ne: 'cancelled' },
      paymentStatus: { $in: ['paid', 'not_required'] },
      'items.product': productId,
    })
  );

// @desc    List approved reviews for a product
// @route   GET /api/products/:id/reviews
export const getProductReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find({ product: id, isApproved: true })
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ product: id, isApproved: true }),
    ]);

    res.json({
      success: true,
      count: reviews.length,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
      summary: reviewSummaryFromProduct(product),
      data: reviews.map(toPublicReview),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a verified-purchase review
// @route   POST /api/products/:id/reviews
export const createProductReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const verified = await hasVerifiedPurchase({ userId: req.user._id, productId: id });
    if (!verified) {
      return res.status(403).json({
        success: false,
        message: 'Reviews are available after a verified purchase',
      });
    }

    const existing = await Review.findOne({ product: id, user: req.user._id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this product',
      });
    }

    const review = await Review.create({
      product: id,
      user: req.user._id,
      rating: req.body.rating,
      title: req.body.title,
      comment: req.body.comment,
      fit: req.body.fit,
      verifiedPurchase: true,
      isApproved: true,
    });

    const updatedProduct = await updateProductReviewAggregates(id);
    await review.populate('user', 'name');

    res.status(201).json({
      success: true,
      summary: reviewSummaryFromProduct(updatedProduct),
      data: toPublicReview(review),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this product',
      });
    }
    next(error);
  }
};
