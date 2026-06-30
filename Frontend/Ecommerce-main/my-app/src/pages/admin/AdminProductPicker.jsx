import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';

const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

const stockLabel = (stock) => {
  const count = Number(stock || 0);
  if (count <= 0) return 'Out of stock';
  if (count <= 5) return `Low stock: ${count}`;
  return `In stock: ${count}`;
};

const priceLabel = (price) => {
  const value = Number(price?.current ?? price ?? 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

export default function AdminProductPicker({
  label = 'Product',
  helper = '',
  onSelect,
  selectedProduct = null,
}) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(selectedProduct);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const loadProducts = async (search = query) => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.getProducts({
        limit: 8,
        sort: 'newest',
        q: search || undefined,
      });
      setProducts(response.data || []);
      setHasSearched(true);
    } catch (err) {
      setError(getErrorMessage(err, 'We could not load products.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    void loadProducts(query);
  };

  const selectProduct = (product) => {
    setSelected(product);
    onSelect?.(product);
  };

  return (
    <section className="border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <h4 className="text-sm font-semibold uppercase text-gray-600">{label}</h4>
        {helper && <p className="text-sm text-gray-600">{helper}</p>}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="flex-1 text-sm font-semibold text-dark">
          Search products
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSearch();
              }
            }}
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
            placeholder="Product name or category"
          />
        </label>
        <div className="flex items-end">
          <button type="button" onClick={handleSearch} className="button-control button-control--secondary button-control--compact">
            Search
          </button>
        </div>
      </div>

      {selected && (
        <p className={`mt-3 border p-3 text-sm ${selected.isStale ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
          {selected.isStale
            ? 'Selected product is no longer in the catalog.'
            : `Selected: ${selected.name} (${stockLabel(selected.stock)})`}
        </p>
      )}

      {error && <p role="alert" className="mt-3 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading && <p role="status" className="mt-3 text-sm text-gray-600">Loading products...</p>}
      {!loading && hasSearched && products.length === 0 && (
        <p className="mt-3 text-sm text-gray-600">No products found.</p>
      )}
      {!loading && products.length > 0 && (
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {products.map((product) => (
            <li key={product._id} className="border border-gray-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-dark">{product.name}</p>
                  <p className="mt-1 text-xs text-gray-600">
                    {product.category} / {priceLabel(product.price)} / {stockLabel(product.stock)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => selectProduct(product)}
                  className="button-control button-control--secondary button-control--compact"
                >
                  Select {product.name}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
