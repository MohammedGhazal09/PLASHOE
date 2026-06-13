import { useState } from 'react';
import ProductGrid from '../components/ProductGrid';
import { useCatalogProducts } from '../hooks/useCatalogProducts';

export default function Collection() {
  const [query, setQuery] = useState({ page: 1, limit: 20 });
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
      <div className="h-[30vh] flex items-center justify-center bg-[#f1f1ef]">
        <h1 className="text-5xl font-bold">Full Collection</h1>
      </div>

      <ProductGrid
        products={products}
        title=""
        showFilters={true}
        query={query}
        pagination={pagination}
        source={source}
        onQueryChange={setQuery}
        onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
      />
    </div>
  );
}
