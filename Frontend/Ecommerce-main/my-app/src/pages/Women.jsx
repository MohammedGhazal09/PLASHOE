import { useState } from 'react';
import ProductGrid from '../components/ProductGrid';
import { useCatalogProducts } from '../hooks/useCatalogProducts';
import womenCollectionHero from '../assets/images/women-collection-hero.webp';

export default function Women() {
  const [query, setQuery] = useState({ gender: 'female', page: 1, limit: 20 });
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
        style={{ backgroundImage: `url(${womenCollectionHero})` }}
      >
        <div className="absolute inset-0 bg-white/10" />
        <div className="relative h-full flex items-center justify-end px-6 md:px-[12%]">
          <div className="text-right">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-dark mb-4">Women's Collection</h1>
            <p className="text-dark/70 text-base md:text-lg">Elegance in every step</p>
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
          setQuery({ ...nextQuery, gender: 'female', page: nextQuery.page || 1 })
        }
        onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
      />
    </div>
  );
}
