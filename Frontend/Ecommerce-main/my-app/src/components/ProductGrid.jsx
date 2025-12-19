import { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import QuickViewModal from './QuickViewModal';

export default function ProductGrid({ products, title, showFilters = true }) {
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [sortBy, setSortBy] = useState('default');
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRating, setSelectedRating] = useState(0);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category))];
    return ['all', ...cats];
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Filter by rating
    if (selectedRating > 0) {
      result = result.filter((p) => (p.rating || 0) >= selectedRating);
    }

    // Filter by price
    result = result.filter((p) => {
      const price = p.price?.current || parseFloat(p.price?.new?.replace('$', '')) || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => {
          const priceA = a.price?.current || parseFloat(a.price?.new?.replace('$', '')) || 0;
          const priceB = b.price?.current || parseFloat(b.price?.new?.replace('$', '')) || 0;
          return priceA - priceB;
        });
        break;
      case 'price-desc':
        result.sort((a, b) => {
          const priceA = a.price?.current || parseFloat(a.price?.new?.replace('$', '')) || 0;
          const priceB = b.price?.current || parseFloat(b.price?.new?.replace('$', '')) || 0;
          return priceB - priceA;
        });
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return result;
  }, [products, sortBy, priceRange, selectedCategory, selectedRating]);

  return (
    <div className="container mx-auto px-4 py-8">
      {title && <h1 className="text-3xl font-bold text-center mb-8">{title}</h1>}

      {showFilters && (
        <div className="flex flex-wrap gap-4 mb-8 justify-center items-center">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 px-4 py-2 rounded"
          >
            <option value="default">Default Sorting</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Rating</option>
            <option value="name">Name</option>
          </select>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 px-4 py-2 rounded"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          {/* Rating */}
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(Number(e.target.value))}
            className="border border-gray-300 px-4 py-2 rounded"
          >
            <option value={0}>All Ratings</option>
            <option value={4}>4+ Stars</option>
            <option value={3}>3+ Stars</option>
            <option value={2}>2+ Stars</option>
          </select>

          {/* Price Range */}
          <div className="flex items-center gap-2">
            <span className="text-sm">Price:</span>
            <input
              type="number"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
              className="w-20 border border-gray-300 px-2 py-1 rounded"
              min="0"
            />
            <span>-</span>
            <input
              type="number"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              className="w-20 border border-gray-300 px-2 py-1 rounded"
              min="0"
            />
          </div>
        </div>
      )}

      {/* Products count */}
      <p className="text-center text-gray-500 mb-4">
        Showing {filteredProducts.length} of {products.length} products
      </p>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product, index) => (
          <ProductCard
            key={product._id || index}
            product={product}
            onQuickView={setQuickViewProduct}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}
    </div>
  );
}
