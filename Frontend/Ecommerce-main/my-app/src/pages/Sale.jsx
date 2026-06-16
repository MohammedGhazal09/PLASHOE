import { useState } from 'react';
import ProductGrid from '../components/ProductGrid';
import { useCatalogProducts } from '../hooks/useCatalogProducts';
import saleHero from '../assets/images/sale-hero.webp';

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
      <div
        className="relative h-[40vh] min-h-[260px] md:h-[50vh] bg-cover bg-center"
        style={{ backgroundImage: `url(${saleHero})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/40 to-transparent" />
        <div className="relative flex h-full items-center justify-start px-6 md:px-[12%]">
          <div className="max-w-lg">
            <h1 className="mb-3 text-4xl font-bold text-dark sm:text-5xl md:text-7xl">
              SALE
            </h1>
            <p className="text-base text-dark/70 md:text-xl">
              Up to 30% off on selected items
            </p>
          </div>
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
