import Product from '../models/Product.js';

const productSorts = {
  'price-asc': { 'price.current': 1 },
  'price-desc': { 'price.current': -1 },
  rating: { rating: -1 },
  newest: { createdAt: -1 },
};

const searchableProductFields = ['name', 'category', 'description'];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSearchQuery = (searchTerm) => {
  const terms = searchTerm
    .trim()
    .split(/\s+/)
    .map(escapeRegex)
    .filter(Boolean);

  if (terms.length === 0) return null;

  const termQueries = terms.map((term) => ({
    $or: searchableProductFields.map((field) => ({
      [field]: { $regex: term, $options: 'i' },
    })),
  }));

  return termQueries.length === 1 ? termQueries[0] : { $and: termQueries };
};

const buildProductQuery = ({
  q,
  gender,
  category,
  sale,
  size,
  minPrice,
  maxPrice,
  minRating,
} = {}) => {
  const query = {};

  if (q) {
    Object.assign(query, buildSearchQuery(q));
  }
  if (gender) query.gender = gender;
  if (category) query.category = category;
  if (sale === true) query.isOnSale = true;
  if (size) query.sizes = size;
  if (minPrice !== undefined || maxPrice !== undefined) {
    query['price.current'] = {};
    if (minPrice !== undefined) query['price.current'].$gte = minPrice;
    if (maxPrice !== undefined) query['price.current'].$lte = maxPrice;
  }
  if (minRating !== undefined) query.rating = { $gte: minRating };

  return query;
};

const sendProductList = async (req, res, routeFilters = {}) => {
  const filters = {
    ...req.query,
    ...routeFilters,
  };
  const { sort, limit = 20, page = 1 } = filters;
  const query = buildProductQuery(filters);
  const skip = (page - 1) * limit;
  const sortDefinition = productSorts[sort] || { createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sortDefinition)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  res.json({
    success: true,
    count: products.length,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    data: products,
  });
};

// @desc    Get all products
// @route   GET /api/products
export const getProducts = async (req, res, next) => {
  try {
    await sendProductList(req, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

const pushUniqueProducts = (target, source, seen, limit) => {
  source.forEach((product) => {
    const id = product._id.toString();
    if (target.length < limit && !seen.has(id)) {
      seen.add(id);
      target.push(product);
    }
  });
};

// @desc    Get related products for one product
// @route   GET /api/products/:id/related
export const getRelatedProducts = async (req, res, next) => {
  try {
    const { limit = 4 } = req.query;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const products = [];
    const seen = new Set([product._id.toString()]);
    const baseProjection = null;
    const sort = { rating: -1, createdAt: -1 };
    const relatedQueries = [
      { gender: product.gender, category: product.category, _id: { $ne: product._id } },
      { category: product.category, _id: { $ne: product._id } },
      { _id: { $ne: product._id } },
    ];

    for (const query of relatedQueries) {
      if (products.length >= limit) break;
      const candidates = await Product.find(query, baseProjection)
        .sort(sort)
        .limit(limit * 2);
      pushUniqueProducts(products, candidates, seen, limit);
    }

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get men's products
// @route   GET /api/products/men
export const getMenProducts = async (req, res, next) => {
  try {
    await sendProductList(req, res, { gender: 'male' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get women's products
// @route   GET /api/products/women
export const getWomenProducts = async (req, res, next) => {
  try {
    await sendProductList(req, res, { gender: 'female' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sale products
// @route   GET /api/products/sale
export const getSaleProducts = async (req, res, next) => {
  try {
    await sendProductList(req, res, { sale: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bestsellers (highest rated)
// @route   GET /api/products/bestsellers
export const getBestsellers = async (req, res, next) => {
  try {
    const products = await Product.find()
      .sort({ rating: -1 })
      .limit(8);
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get categories
// @route   GET /api/products/categories
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category');
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product (admin)
// @route   POST /api/products
export const createProduct = async (req, res, next) => {
  try {
    const productData = req.body;
    const product = await Product.create(productData);
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product (admin)
// @route   PUT /api/products/:id
export const updateProduct = async (req, res, next) => {
  try {
    const productData = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (admin)
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted'
    });
  } catch (error) {
    next(error);
  }
};
