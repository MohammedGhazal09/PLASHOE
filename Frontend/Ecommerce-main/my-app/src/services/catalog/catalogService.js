import { productsApi } from '../../api/productsApi';
import { joinPublicPath } from '../../utils/publicPath';
import { normalizeProduct, normalizeProducts } from './normalizeProduct';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const toPositiveInt = (value, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

const isSaleQuery = (value) => value === true || value === 'true';
const toOptionalNumber = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

const cleanTextParam = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const cleanCatalogParams = (params = {}) => {
  const cleaned = { ...params };

  cleaned.q = cleanTextParam(cleaned.q);
  if (!cleaned.q) delete cleaned.q;
  if (!cleaned.category || cleaned.category === 'all') delete cleaned.category;
  if (!cleaned.sort || cleaned.sort === 'default') delete cleaned.sort;
  if (!cleaned.size) delete cleaned.size;
  if (!cleaned.minPrice && cleaned.minPrice !== 0) delete cleaned.minPrice;
  if (!cleaned.maxPrice && cleaned.maxPrice !== 0) delete cleaned.maxPrice;
  if (!cleaned.minRating && cleaned.minRating !== 0) delete cleaned.minRating;
  if (!isSaleQuery(cleaned.sale)) delete cleaned.sale;

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
    count: products.length,
    total,
    page,
    limit,
    pages,
  };
};

const sortCatalogProducts = (products, sort) => {
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

const matchesCatalogParams = (product, catalogParams) => {
  const minPrice = toOptionalNumber(catalogParams.minPrice);
  const maxPrice = toOptionalNumber(catalogParams.maxPrice);
  const minRating = toOptionalNumber(catalogParams.minRating);
  const size = toOptionalNumber(catalogParams.size);
  const search = cleanTextParam(catalogParams.q)?.toLowerCase();
  const currentPrice = Number(product.price?.current ?? 0);

  if (search) {
    const matchesSearch = [product.name, product.category, product.description]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search));

    if (!matchesSearch) return false;
  }

  if (catalogParams.gender && product.gender !== catalogParams.gender) return false;
  if (catalogParams.category && product.category !== catalogParams.category) return false;
  if (isSaleQuery(catalogParams.sale) && !product.isOnSale) return false;
  if (size !== undefined && !product.sizes?.includes(size)) return false;
  if (minPrice !== undefined && currentPrice < minPrice) return false;
  if (maxPrice !== undefined && currentPrice > maxPrice) return false;
  if (minRating !== undefined && Number(product.rating ?? 0) < minRating) return false;

  return true;
};

const applyCatalogFilters = (products, catalogParams) =>
  sortCatalogProducts(
    products.filter((product) => matchesCatalogParams(product, catalogParams)),
    catalogParams.sort
  );

const readFallbackDatabase = async () => {
  const response = await fetch(joinPublicPath('database/database.json'));

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

  const sourceGroup = isSaleQuery(catalogParams.sale) ? 'sale' : undefined;
  const filteredEntries = entries.filter(({ product, group }) => {
    const normalized = normalizeProduct(
      { ...product, gender: group },
      { source: 'fallback', sourceGroup: sourceGroup || group }
    );

    return matchesCatalogParams(normalized, catalogParams);
  });
  const normalizedProducts = filteredEntries.map(({ product, group }, index) =>
    normalizeProduct(
      { ...product, gender: group },
      { source: 'fallback', sourceGroup: sourceGroup || group, index }
    )
  );
  const sortedProducts = applyCatalogFilters(normalizedProducts, catalogParams);
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

    const backendProducts = normalizeProducts(response.data || [], { source: 'backend' });
    const products = applyCatalogFilters(backendProducts, catalogParams);
    const pagination = paginationFrom(response, products, catalogParams);

    if (products.length !== backendProducts.length) {
      pagination.total = products.length;
      pagination.pages = Math.ceil(products.length / pagination.limit);
    }

    return {
      products,
      pagination,
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
