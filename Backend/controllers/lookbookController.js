import LookbookEntry from '../models/LookbookEntry.js';
import Product from '../models/Product.js';

const productProjection = 'name gender category image gallery price rating sizes stock isOnSale description';

const productSummary = (product) => {
  if (!product) return null;

  return {
    _id: product._id,
    name: product.name,
    gender: product.gender,
    category: product.category,
    image: product.image,
    gallery: product.gallery || [],
    price: product.price,
    rating: product.rating,
    sizes: product.sizes || [],
    stock: product.stock ?? 0,
    isOnSale: product.isOnSale,
    description: product.description,
  };
};

const toLookbookEntry = (entry) => ({
  _id: entry._id,
  title: entry.title,
  description: entry.description,
  image: entry.image,
  status: entry.status,
  sortOrder: entry.sortOrder,
  hotspots: (entry.hotspots || [])
    .map((hotspot) => ({
      product: productSummary(hotspot.product),
      x: hotspot.x,
      y: hotspot.y,
      label: hotspot.label,
    }))
    .filter((hotspot) => hotspot.product),
  bundle: entry.bundle
    ? {
        title: entry.bundle.title,
        description: entry.bundle.description,
        items: (entry.bundle.items || [])
          .map((item) => ({
            product: productSummary(item.product),
            defaultSize: item.defaultSize,
            quantity: item.quantity || 1,
          }))
          .filter((item) => item.product),
      }
    : null,
  createdAt: entry.createdAt,
  updatedAt: entry.updatedAt,
});

const populateProducts = (query) =>
  query
    .populate('hotspots.product', productProjection)
    .populate('bundle.items.product', productProjection);

const collectProductIds = (payload = {}) => {
  const ids = [];

  (payload.hotspots || []).forEach((hotspot) => {
    if (hotspot.productId) ids.push(hotspot.productId);
  });

  (payload.bundle?.items || []).forEach((item) => {
    if (item.productId) ids.push(item.productId);
  });

  return [...new Set(ids)];
};

const ensureReferencedProductsExist = async (payload) => {
  const productIds = collectProductIds(payload);
  if (productIds.length === 0) return;

  const count = await Product.countDocuments({ _id: { $in: productIds } });
  if (count !== productIds.length) {
    const error = new Error('Lookbook entries can only reference existing products');
    error.statusCode = 400;
    throw error;
  }
};

const toDocumentPayload = (payload = {}) => {
  const nextPayload = { ...payload };

  if (payload.hotspots) {
    nextPayload.hotspots = payload.hotspots.map(({ productId, ...hotspot }) => ({
      ...hotspot,
      product: productId,
    }));
  }

  if (payload.bundle) {
    nextPayload.bundle = {
      ...payload.bundle,
      items: payload.bundle.items.map(({ productId, ...item }) => ({
        ...item,
        product: productId,
      })),
    };
  }

  return nextPayload;
};

export const listLookbookEntries = async (req, res, next) => {
  try {
    const entries = await populateProducts(
      LookbookEntry.find({ status: 'active' }).sort({ sortOrder: 1, createdAt: -1 })
    );

    res.json({
      success: true,
      count: entries.length,
      data: entries.map(toLookbookEntry),
    });
  } catch (error) {
    next(error);
  }
};

export const listAdminLookbookEntries = async (req, res, next) => {
  try {
    const entries = await populateProducts(
      LookbookEntry.find().sort({ sortOrder: 1, createdAt: -1 })
    );

    res.json({
      success: true,
      count: entries.length,
      data: entries.map(toLookbookEntry),
    });
  } catch (error) {
    next(error);
  }
};

export const createLookbookEntry = async (req, res, next) => {
  try {
    const payload = req.validated?.body || req.body;
    await ensureReferencedProductsExist(payload);

    const entry = await LookbookEntry.create(toDocumentPayload(payload));
    const populatedEntry = await populateProducts(LookbookEntry.findById(entry._id));

    res.status(201).json({
      success: true,
      data: toLookbookEntry(populatedEntry),
    });
  } catch (error) {
    next(error);
  }
};

export const updateLookbookEntry = async (req, res, next) => {
  try {
    const payload = req.validated?.body || req.body;
    await ensureReferencedProductsExist(payload);

    const entry = await populateProducts(
      LookbookEntry.findByIdAndUpdate(
        req.params.id,
        toDocumentPayload(payload),
        { new: true, runValidators: true }
      )
    );

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Lookbook entry not found',
      });
    }

    res.json({
      success: true,
      data: toLookbookEntry(entry),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLookbookEntry = async (req, res, next) => {
  try {
    const entry = await LookbookEntry.findByIdAndDelete(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Lookbook entry not found',
      });
    }

    res.json({
      success: true,
      message: 'Lookbook entry deleted',
    });
  } catch (error) {
    next(error);
  }
};
