import { useState, useEffect } from 'react';
import { productsApi } from '../api/productsApi';
import ProductGrid from '../components/ProductGrid';

export default function Collection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productsApi.getAll();
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
          const allProducts = [
            ...json.female.map((p) => ({
              ...p,
              gender: 'female',
              price: {
                current: parseFloat(p.price.new.replace('$', '')),
                original: parseFloat(p.price.old.replace('$', '')),
              },
            })),
            ...json.male.map((p) => ({
              ...p,
              gender: 'male',
              price: {
                current: parseFloat(p.price.new.replace('$', '')),
                original: parseFloat(p.price.old.replace('$', '')),
              },
            })),
          ];
          setProducts(allProducts);
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
      <div className="h-[30vh] flex items-center justify-center bg-[#f1f1ef]">
        <h1 className="text-5xl font-bold">Full Collection</h1>
      </div>

      <ProductGrid products={products} title="" showFilters={true} />
    </div>
  );
}
