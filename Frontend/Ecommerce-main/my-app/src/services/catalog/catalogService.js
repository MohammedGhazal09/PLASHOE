import { productsApi } from '../../api/productsApi';
import { normalizeProduct, normalizeProducts } from './normalizeProduct';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const toPositiveInt = (value, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

const isSaleQuery = (value) => value === true || value === 'true';

export const cleanCatalogParams = (params = {}) => {
  const cleaned = { ...params };

  if (!cleaned.category || cleaned.category === 'all') delete cleaned.category;
  if (!cleaned.sort || cleaned.sort === 'default') delete cleaned.sort;

  cleaned.page = toPositiveInt(cleaned.page, DEFAULT_PAGE);
  cleaned.limit = toPositiveInt(cleaned.limit, DEFAULT_LIMIT);

  return cleaned;
};

const paginationFrom = (response = {}, products = [], params = {}) => {
  const page = toPositiveInt(response.page ?? params.page, DEFAULT_PAGE);
  const limit = toPositiveInt(response.limit ?? params.limit, DEFAULT_LIMIT);
  const total = Number.isFinite(Number(response.total)) ? Number(response.total) : products.length;
  const pages =
    Number.isFinite(Number(response.pages)) && Number(response.pages) >= 0
      ? Number(response.pages)
      : Math.ceil(total / limit);

  return {
    count: Number.isFinite(Number(response.count)) ? Number(response.count) : products.length,
    total,
    page,
    limit,
    pages,
  };
};

const sortFallbackProducts = (products, sort) => {
  const sorted = [...products];

  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price.current - b.price.current);
    case 'price-desc':
      return sorted.sort((a, b) => b.price.current - a.price.current);
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);
    default:
      return sorted;
  }
};

const readFallbackDatabase = async () => {
  const publicUrl = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  const databasePath = ['database', 'database.json'].join('/');
  const response = await fetch(`${publicUrl}/${databasePath}`);

  if (!response.ok) {
    throw new Error('Failed to load fallback product catalog');
  }

  return response.json();
};

export const loadFallbackCatalogProducts = async (params = {}) => {
  const catalogParams = cleanCatalogParams(params);
  const database = await readFallbackDatabase();
  const entries = [
    ...(database.female || []).map((product) => ({ product, group: 'female' })),
    ...(database.male || []).map((product) => ({ product, group: 'male' })),
  ];

  const filteredEntries = entries.filter(({ product, group }) => {
    if (catalogParams.gender && catalogParams.gender !== group) return false;
    if (catalogParams.category && product.category !== catalogParams.category) return false;
    if (isSaleQuery(catalogParams.sale)) {
      const normalized = normalizeProduct(product, { source: 'fallback', sourceGroup: group });
      return normalized.isOnSale;
    }
    return true;
  });

  const sourceGroup = isSaleQuery(catalogParams.sale) ? 'sale' : undefined;
  const normalizedProducts = filteredEntries.map(({ product, group }, index) =>
    normalizeProduct(
      { ...product, gender: group },
      { source: 'fallback', sourceGroup: sourceGroup || group, index }
    )
  );
  const sortedProducts = sortFallbackProducts(normalizedProducts, catalogParams.sort);
  const start = (catalogParams.page - 1) * catalogParams.limit;
  const pagedProducts = sortedProducts.slice(start, start + catalogParams.limit);

  return {
    products: pagedProducts,
    pagination: {
      count: pagedProducts.length,
      total: sortedProducts.length,
      page: catalogParams.page,
      limit: catalogParams.limit,
      pages: Math.ceil(sortedProducts.length / catalogParams.limit),
    },
    source: 'fallback',
    error: null,
  };
};

export const loadCatalogProducts = async (params = {}) => {
  const catalogParams = cleanCatalogParams(params);

  try {
    const response = await productsApi.getAll(catalogParams);

    if (!response?.success) {
      throw new Error(response?.message || 'Product catalog request failed');
    }

    const products = normalizeProducts(response.data || [], { source: 'backend' });

    return {
      products,
      pagination: paginationFrom(response, products, catalogParams),
      source: 'backend',
      error: null,
    };
  } catch (error) {
    try {
      const fallback = await loadFallbackCatalogProducts(catalogParams);
      return { ...fallback, error };
    } catch (fallbackError) {
      return {
        products: [],
        pagination: paginationFrom({}, [], catalogParams),
        source: 'fallback',
        error: fallbackError,
      };
    }
  }
};
