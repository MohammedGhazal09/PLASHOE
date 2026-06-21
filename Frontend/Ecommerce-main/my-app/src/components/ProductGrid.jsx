import { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import QuickViewModal from './QuickViewModal';

const CATEGORY_OPTIONS = ['all', 'Training', 'Running', 'Sneaker', 'Classic'];
const SIZE_OPTIONS = [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
const RATING_OPTIONS = [
  { value: '', label: 'All Ratings' },
  { value: '4', label: '4+ stars' },
  { value: '3', label: '3+ stars' },
  { value: '2', label: '2+ stars' },
  { value: '1', label: '1+ stars' },
];

const isSaleQuery = (value) => value === true || value === 'true';
const toOptionalNumber = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

const sortProducts = (products, sortBy) => {
  const sorted = [...products];

  switch (sortBy) {
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

const matchesSearch = (product, searchTerm) => {
  const normalizedSearch = searchTerm?.trim().toLowerCase();
  if (!normalizedSearch) return true;

  return [product.name, product.category, product.description]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(normalizedSearch));
};

const matchesQuery = (product, query) => {
  const minPrice = toOptionalNumber(query.minPrice);
  const maxPrice = toOptionalNumber(query.maxPrice);
  const minRating = toOptionalNumber(query.minRating);
  const size = toOptionalNumber(query.size);
  const currentPrice = Number(product.price?.current ?? 0);

  if (!matchesSearch(product, query.q)) return false;
  if (query.gender && product.gender !== query.gender) return false;
  if (query.category && query.category !== 'all' && product.category !== query.category) return false;
  if (isSaleQuery(query.sale) && !product.isOnSale) return false;
  if (size !== undefined && !product.sizes?.includes(size)) return false;
  if (minPrice !== undefined && currentPrice < minPrice) return false;
  if (maxPrice !== undefined && currentPrice > maxPrice) return false;
  if (minRating !== undefined && Number(product.rating ?? 0) < minRating) return false;

  return true;
};

export default function ProductGrid({
  products = [],
  title,
  showFilters = true,
  query = {},
  pagination = {},
  loading = false,
  error = null,
  source = 'backend',
  lockedFilters = {},
  onQueryChange,
  onPageChange,
}) {
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [localQuery, setLocalQuery] = useState({ category: 'all', sort: 'default', page: 1 });
  const isControlled = Boolean(onQueryChange || onPageChange);
  const activeQuery = isControlled ? query : localQuery;
  const selectedCategory = activeQuery.category || 'all';
  const sortBy = activeQuery.sort || 'default';
  const saleLocked = isSaleQuery(lockedFilters.sale);
  const saleOnly = isSaleQuery(activeQuery.sale);

  const displayedProducts = useMemo(() => {
    const result = products.filter((product) => matchesQuery(product, activeQuery));

    return sortProducts(result, sortBy);
  }, [products, activeQuery, sortBy]);

  const cleanQuery = (nextQuery) =>
    Object.entries(nextQuery).reduce((cleaned, [key, value]) => {
      if (value === undefined || value === null || value === '') return cleaned;
      if (key === 'category' && value === 'all') return cleaned;
      if (key === 'sort' && value === 'default') return cleaned;
      if (key === 'sale' && (value === false || value === 'false')) return cleaned;
      return {
        ...cleaned,
        [key]: value,
      };
    }, {});

  const updateQuery = (updates) => {
    const nextQuery = cleanQuery({
      ...activeQuery,
      ...updates,
      page: 1,
    });

    if (onQueryChange) {
      onQueryChange(nextQuery);
    } else {
      setLocalQuery({
        ...nextQuery,
        category: nextQuery.category || 'all',
        sort: nextQuery.sort || 'default',
      });
    }
  };

  const currentPage = pagination.page || activeQuery.page || 1;
  const totalPages = pagination.pages || 0;
  const clientFilteredProducts = displayedProducts.length !== products.length;
  const totalProducts = clientFilteredProducts
    ? displayedProducts.length
    : pagination.total ?? products.length;
  const canGoPrevious = currentPage > 1;
  const canGoNext = totalPages > 0 && currentPage < totalPages;

  const changePage = (page) => {
    if (onPageChange) {
      onPageChange(page);
    } else {
      setLocalQuery((current) => ({ ...current, page }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8" data-catalog-source={source}>
      {title && <h1 className="text-3xl font-bold text-center mb-8">{title}</h1>}

      {showFilters && (
        <div className="mb-8 grid gap-3 rounded border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-4">
          <input
            type="search"
            value={activeQuery.q || ''}
            onChange={(e) => updateQuery({ q: e.target.value })}
            aria-label="Search products"
            placeholder="Search products"
            className="border border-gray-300 px-4 py-2"
          />

          <select
            value={sortBy}
            onChange={(e) => updateQuery({ sort: e.target.value })}
            aria-label="Sort products"
            className="border border-gray-300 px-4 py-2"
          >
            <option value="default">Default Sorting</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Rating</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => updateQuery({ category: e.target.value })}
            aria-label="Filter by category"
            className="border border-gray-300 px-4 py-2"
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <select
            value={activeQuery.size || ''}
            onChange={(e) => updateQuery({ size: e.target.value })}
            aria-label="Filter by size"
            className="border border-gray-300 px-4 py-2"
          >
            <option value="">All Sizes</option>
            {SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                Size {size}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            value={activeQuery.minPrice || ''}
            onChange={(e) => updateQuery({ minPrice: e.target.value })}
            aria-label="Minimum price"
            placeholder="Min price"
            className="border border-gray-300 px-4 py-2"
          />

          <input
            type="number"
            min="0"
            value={activeQuery.maxPrice || ''}
            onChange={(e) => updateQuery({ maxPrice: e.target.value })}
            aria-label="Maximum price"
            placeholder="Max price"
            className="border border-gray-300 px-4 py-2"
          />

          <select
            value={activeQuery.minRating || ''}
            onChange={(e) => updateQuery({ minRating: e.target.value })}
            aria-label="Minimum rating"
            className="border border-gray-300 px-4 py-2"
          >
            {RATING_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {!saleLocked && (
            <label className="flex min-h-[42px] items-center gap-2 border border-gray-300 px-4 py-2 text-sm">
              <input
                type="checkbox"
                checked={saleOnly}
                onChange={(e) => updateQuery({ sale: e.target.checked ? 'true' : undefined })}
                aria-label="Sale products only"
                className="h-4 w-4"
              />
              Sale only
            </label>
          )}
        </div>
      )}

      {loading && (
        <p role="status" className="mb-4 text-center text-sm text-gray-500">
          Updating catalog...
        </p>
      )}

      {error && (
        <p role="alert" className="mb-4 text-center text-sm text-amber-700">
          Live catalog unavailable. Showing available product data.
        </p>
      )}

      {/* Products count */}
      <p className="text-center text-gray-500 mb-4">
        Showing {displayedProducts.length} of {totalProducts} products
      </p>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {displayedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onQuickView={setQuickViewProduct}
          />
        ))}
      </div>

      {displayedProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            type="button"
            onClick={() => changePage(currentPage - 1)}
            disabled={!canGoPrevious}
            className="border border-gray-300 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:border-black"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => changePage(currentPage + 1)}
            disabled={!canGoNext}
            className="border border-gray-300 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:border-black"
          >
            Next
          </button>
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}
    </div>
  );
}
