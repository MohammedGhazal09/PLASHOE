import { useState, useEffect } from 'react';
import { productsApi } from '../api/productsApi';
import ProductGrid from '../components/ProductGrid';

export default function Sale() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productsApi.getSale();
        if (response.success && response.data.length > 0) {
          setProducts(response.data);
        } else {
          throw new Error('API failed or no sale products');
        }
      } catch (error) {
        // Fallback to static JSON - filter for discounted products
        try {
          const res = await fetch(`${process.env.PUBLIC_URL}/database/database.json`);
          const json = await res.json();
          const allProducts = [...json.female, ...json.male];
          const saleProducts = allProducts
            .filter((p) => p.price.old !== p.price.new)
            .map((p, index) => ({
              ...p,
              _id: `local-sale-${index}`,
              isOnSale: true,
              price: {
                current: parseFloat(p.price.new.replace('$', '')),
                original: parseFloat(p.price.old.replace('$', '')),
              },
            }));
          setProducts(saleProducts);
        } catch (err) {
          console.error('Failed to load products:', err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
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

      <ProductGrid products={products} title="" showFilters={true} />

      {products.length === 0 && !loading && (
        <div className="text-center py-20">
          <h2 className="text-2xl text-gray-500">No sale items available at the moment</h2>
          <p className="text-gray-400 mt-2">Check back soon for new deals!</p>
        </div>
      )}
    </div>
  );
}
