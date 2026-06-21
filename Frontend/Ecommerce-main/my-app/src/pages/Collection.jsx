import ProductGrid from '../components/ProductGrid';
import { useCatalogProducts } from '../hooks/useCatalogProducts';
import { useCatalogUrlQuery } from '../hooks/useCatalogUrlQuery';
import collectionHero from '../assets/images/collection-hero.webp';

export default function Collection() {
  const { query, setQuery, setPage } = useCatalogUrlQuery();
  const { products, pagination, loading, error, source } = useCatalogProducts(query);

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
        style={{ backgroundImage: `url(${collectionHero})` }}
      >
        <div className="absolute inset-0 bg-white/10" />
        <div className="relative flex h-full items-start justify-center px-6 pt-20 text-center sm:pt-24 md:pt-28">
          <div>
            <h1 className="mb-4 text-3xl font-bold text-dark sm:text-4xl md:text-6xl">
              Full Collection
            </h1>
            <p className="text-base text-dark/70 md:text-lg">
              Every sustainable step in one place
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
        loading={loading}
        error={error}
        source={source}
        onQueryChange={setQuery}
        onPageChange={setPage}
      />
    </div>
  );
}
