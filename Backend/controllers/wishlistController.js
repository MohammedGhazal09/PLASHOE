import Product from '../models/Product.js';
import Wishlist from '../models/Wishlist.js';

const PRODUCT_POPULATE_FIELDS = 'name image price sizes stock category gender isOnSale';

const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, items: [] });
  }

  return wishlist;
};

const populateWishlist = (wishlist) =>
  wishlist.populate('items.product', PRODUCT_POPULATE_FIELDS);

const toWishlistItem = (item) => {
  if (!item.product) {
    return null;
  }

  return {
    productId: item.product._id.toString(),
    addedAt: item.addedAt,
    product: item.product,
  };
};

const buildWishlistEnvelope = async (wishlist, { page = 1, limit = 20 } = {}) => {
  await populateWishlist(wishlist);

  const items = wishlist.items.map(toWishlistItem).filter(Boolean);
  const total = items.length;
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);

  return {
    success: true,
    count: data.length,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit) || 1,
    data,
  };
};

// @desc    Get user's wishlist
// @route   GET /api/wishlist
export const getWishlist = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const wishlist = await getOrCreateWishlist(req.user._id);

    res.json(await buildWishlistEnvelope(wishlist, { page, limit }));
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to wishlist
// @route   POST /api/wishlist/items
export const addWishlistItem = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const wishlist = await getOrCreateWishlist(req.user._id);
    const exists = wishlist.items.some((item) => item.product.toString() === productId);

    if (!exists) {
      wishlist.items.push({ product: productId });
      await wishlist.save();
    }

    res.json(await buildWishlistEnvelope(wishlist));
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from wishlist
// @route   DELETE /api/wishlist/items/:productId
export const removeWishlistItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const wishlist = await getOrCreateWishlist(req.user._id);

    wishlist.items = wishlist.items.filter((item) => item.product.toString() !== productId);
    await wishlist.save();

    res.json(await buildWishlistEnvelope(wishlist));
  } catch (error) {
    next(error);
  }
};

