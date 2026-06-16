import { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import QuickViewModal from './QuickViewModal';

const CATEGORY_OPTIONS = ['all', 'Training', 'Running', 'Sneaker', 'Classic'];

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

export default function ProductGrid({
  products = [],
  title,
  showFilters = true,
  query = {},
  pagination = {},
  source = 'backend',
  onQueryChange,
  onPageChange,
}) {
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [localQuery, setLocalQuery] = useState({ category: 'all', sort: 'default', page: 1 });
  const isControlled = Boolean(onQueryChange || onPageChange);
  const activeQuery = isControlled ? query : localQuery;
  const selectedCategory = activeQuery.category || 'all';
  const sortBy = activeQuery.sort || 'default';

  const displayedProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    return sortProducts(result, sortBy);
  }, [products, selectedCategory, sortBy]);

  const updateQuery = (updates) => {
    const nextQuery = {
      ...activeQuery,
      ...updates,
      page: 1,
    };

    if (!nextQuery.category || nextQuery.category === 'all') delete nextQuery.category;
    if (!nextQuery.sort || nextQuery.sort === 'default') delete nextQuery.sort;

    if (onQueryChange) {
      onQueryChange(nextQuery);
    } else {
      setLocalQuery({
        category: nextQuery.category || 'all',
        sort: nextQuery.sort || 'default',
        page: nextQuery.page,
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
        <div className="flex flex-wrap gap-4 mb-8 justify-center items-center">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => updateQuery({ sort: e.target.value })}
            aria-label="Sort products"
            className="border border-gray-300 px-4 py-2 rounded"
          >
            <option value="default">Default Sorting</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Rating</option>
          </select>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => updateQuery({ category: e.target.value })}
            aria-label="Filter by category"
            className="border border-gray-300 px-4 py-2 rounded"
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
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
