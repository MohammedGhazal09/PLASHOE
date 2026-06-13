import { useState } from 'react';
import ProductGrid from '../components/ProductGrid';
import { useCatalogProducts } from '../hooks/useCatalogProducts';

export default function Sale() {
  const [query, setQuery] = useState({ sale: 'true', page: 1, limit: 20 });
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
      <div className="h-[30vh] flex items-center justify-center bg-red-500">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-2">SALE</h1>
          <p className="text-white text-xl">Up to 30% off on selected items</p>
        </div>
      </div>

      <ProductGrid
        products={products}
        title=""
        showFilters={true}
        query={query}
        pagination={pagination}
        source={source}
        onQueryChange={(nextQuery) =>
          setQuery({ ...nextQuery, sale: 'true', page: nextQuery.page || 1 })
        }
        onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
      />

    </div>
  );
}
