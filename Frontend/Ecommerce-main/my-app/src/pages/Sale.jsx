import ProductGrid from '../components/ProductGrid';
import { useCatalogProducts } from '../hooks/useCatalogProducts';
import { useCatalogUrlQuery } from '../hooks/useCatalogUrlQuery';
import saleHero from '../assets/images/sale-hero.webp';

export default function Sale() {
  const forcedFilters = { sale: 'true' };
  const { query, setQuery, setPage } = useCatalogUrlQuery({ forcedParams: forcedFilters });
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
        loading={loading}
        error={error}
        source={source}
        lockedFilters={forcedFilters}
        onQueryChange={setQuery}
        onPageChange={setPage}
      />

    </div>
  );
}
