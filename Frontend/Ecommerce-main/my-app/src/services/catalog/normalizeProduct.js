import { joinPublicPath } from '../../utils/publicPath';

const DEFAULT_SIZES = [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

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

  return {
    id,
    name: product.name || 'Product',
    gender:
      product.gender ||
      (sourceGroup === 'male' || sourceGroup === 'female' ? sourceGroup : ''),
    category: product.category || '',
    image: renderReadyImage(product.image || legacyImage),
    price: {
      current: currentPrice,
      original: originalPrice,
    },
    rating: toNumber(product.rating, 0),
    sizes: Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : DEFAULT_SIZES,
    stock: toNumber(product.stock, 0),
    isOnSale: Boolean(product.isOnSale || originalPrice > currentPrice),
    description: product.description || '',
    source,
    raw: product,
  };
};

export const normalizeProducts = (products = [], options = {}) =>
  products.map((product, index) => normalizeProduct(product, { ...options, index }));
