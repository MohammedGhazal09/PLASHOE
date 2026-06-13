import { useState } from 'react';
import ProductGrid from '../components/ProductGrid';
import { useCatalogProducts } from '../hooks/useCatalogProducts';

export default function Men() {
  const [query, setQuery] = useState({ gender: 'male', page: 1, limit: 20 });
  const { products, pagination, loading, source } = useCatalogProducts(query);

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div
        className="h-[40vh] md:h-[50vh] relative bg-cover bg-center"
        style={{ backgroundImage: "url('/database/Male/0.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Men's Collection</h1>
            <p className="text-white/80 text-lg">Discover comfort meets style</p>
          </div>
        </div>
      </div>

      <ProductGrid
        products={products}
        showFilters={true}
        query={query}
        pagination={pagination}
        source={source}
        onQueryChange={(nextQuery) =>
          setQuery({ ...nextQuery, gender: 'male', page: nextQuery.page || 1 })
        }
        onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
      />
    </div>
  );
}
