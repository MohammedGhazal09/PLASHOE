import { useState } from 'react';
import ProductGrid from '../components/ProductGrid';
import { useCatalogProducts } from '../hooks/useCatalogProducts';
import menCollectionHero from '../assets/images/men-collection-hero.webp';

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
        className="h-[40vh] md:h-[50vh] relative bg-cover bg-no-repeat"
        style={{ backgroundImage: `url(${menCollectionHero})`, backgroundPosition: 'right center' }}
      >
        <div className="absolute inset-0 bg-white/10" />
        <div className="relative h-full flex items-center justify-start px-6 md:px-[12%]">
          <div className="text-left">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-dark mb-4">Men's Collection</h1>
            <p className="text-dark/70 text-base md:text-lg">Discover comfort meets style</p>
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
