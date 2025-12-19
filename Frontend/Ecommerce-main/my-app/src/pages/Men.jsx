import { useState, useEffect } from 'react';
import { productsApi } from '../api/productsApi';
import ProductGrid from '../components/ProductGrid';

export default function Men() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productsApi.getMen();
        if (response.success) {
          setProducts(response.data);
        } else {
          throw new Error('API failed');
        }
      } catch (error) {
        // Fallback to static JSON
        try {
          const res = await fetch(`${process.env.PUBLIC_URL}/database/database.json`);
          const json = await res.json();
          const maleProducts = json.male.map((p) => ({
            ...p,
            gender: 'male',
            price: {
              current: parseFloat(p.price.new.replace('$', '')),
              original: parseFloat(p.price.old.replace('$', '')),
            },
          }));
          setProducts(maleProducts);
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

      <ProductGrid products={products} showFilters={true} />
    </div>
  );
}
