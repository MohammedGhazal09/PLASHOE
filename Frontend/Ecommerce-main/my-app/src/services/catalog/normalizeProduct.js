import { joinPublicPath } from '../../utils/publicPath';

const DEFAULT_SIZES = [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
const DEFAULT_RATING_DISTRIBUTION = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
const DEFAULT_FIT_SUMMARY = {
  runsSmall: 0,
  trueToSize: 0,
  runsLarge: 0,
  total: 0,
  dominant: null,
};

const absoluteUrlPattern = /^(https?:|data:|blob:)/i;

const toNumber = (value, fallback = 0) => {
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const renderReadyImage = (value = '') => {
  if (!value) return '';
  if (absoluteUrlPattern.test(value)) return value;

  return joinPublicPath(value);
};

const normalizeRatingDistribution = (value = {}) =>
  Object.keys(DEFAULT_RATING_DISTRIBUTION).reduce(
    (distribution, key) => ({
      ...distribution,
      [key]: toNumber(value?.[key], 0),
    }),
    {}
  );

const normalizeFitSummary = (value = {}) => ({
  ...DEFAULT_FIT_SUMMARY,
  runsSmall: toNumber(value.runsSmall, 0),
  trueToSize: toNumber(value.trueToSize, 0),
  runsLarge: toNumber(value.runsLarge, 0),
  total: toNumber(value.total, 0),
  dominant: value.dominant || null,
});

const normalizeSustainability = (value = {}) => {
  const manufacturing = value.manufacturing || {};
  const durability = value.durability || {};

  return {
    summary: value.summary || '',
    source: value.source || '',
    impactMetrics: Array.isArray(value.impactMetrics)
      ? value.impactMetrics.filter((metric) => metric?.label && metric?.value && metric?.source)
      : [],
    certifications: Array.isArray(value.certifications)
      ? value.certifications.filter((certification) => certification?.name && certification?.issuer)
      : [],
    manufacturing: {
      location: manufacturing.location || '',
      facility: manufacturing.facility || '',
      process: manufacturing.process || '',
      source: manufacturing.source || '',
    },
    durability: {
      summary: durability.summary || '',
      repairability: durability.repairability || '',
      expectedUse: durability.expectedUse || '',
      source: durability.source || '',
    },
  };
};

export const normalizeProduct = (
  product = {},
  { source = 'backend', sourceGroup = 'product', index = 0 } = {}
) => {
  const legacyImage = product['img'];
  const rawId = product.id || product._id;
  const id = rawId ? String(rawId) : `local-${sourceGroup}-${index}`;
  const currentPrice = toNumber(product.price?.current ?? product.price?.new, 0);
  const originalPrice = toNumber(
    product.price?.original ?? product.price?.old,
    currentPrice
  );
  const primaryImage = renderReadyImage(product.image || legacyImage);
  const gallery = Array.isArray(product.gallery)
    ? product.gallery.map(renderReadyImage).filter(Boolean)
    : [];

  return {
    id,
    name: product.name || 'Product',
    gender:
      product.gender ||
      (sourceGroup === 'male' || sourceGroup === 'female' ? sourceGroup : ''),
    category: product.category || '',
    image: primaryImage,
    gallery: gallery.length > 0 ? gallery : primaryImage ? [primaryImage] : [],
    price: {
      current: currentPrice,
      original: originalPrice,
    },
    rating: toNumber(product.rating, 0),
    sizes: Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : DEFAULT_SIZES,
    stock: toNumber(product.stock, 0),
    isOnSale: Boolean(product.isOnSale || originalPrice > currentPrice),
    description: product.description || '',
    materials: Array.isArray(product.materials) ? product.materials : [],
    careInstructions: Array.isArray(product.careInstructions) ? product.careInstructions : [],
    fitGuide: product.fitGuide || {},
    sustainability: normalizeSustainability(product.sustainability),
    recommendationReason: product.recommendationReason || '',
    reviewCount: toNumber(product.reviewCount, 0),
    ratingDistribution: normalizeRatingDistribution(product.ratingDistribution),
    fitSummary: normalizeFitSummary(product.fitSummary),
    source,
    raw: product,
  };
};

export const normalizeProducts = (products = [], options = {}) =>
  products.map((product, index) => normalizeProduct(product, { ...options, index }));
