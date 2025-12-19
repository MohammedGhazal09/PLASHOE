import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPinterestP, faXTwitter, faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons';
import Rating from '@mui/material/Rating';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import { productsApi } from '../api/productsApi';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { config } from '../config/config';

// Import images
import asSeen1 from '../assets/images/asSeen1.png';
import asSeen2 from '../assets/images/asSeen2.png';
import asSeen3 from '../assets/images/asSeen3.png';
import asSeen4 from '../assets/images/asSeen4.png';
import asSeen5 from '../assets/images/asSeen5.png';
import aboutUsImg from '../assets/images/aboutUsImg.jpg';
import shoes from '../assets/images/shoes.png';
import RecycledImg from '../assets/images/RecycledImg.png';
import VeganImg from '../assets/images/VeganImg.png';
import handMadeImg from '../assets/images/handMadeImg.png';
import heroImg from '../assets/images/homePage.jpg';
import menRouteImg from '../assets/images/menRoute.jpg';
import womenRouteImg from '../assets/images/womenRoute.jpg';

// External male customer testimonial images - use config
const MaleCustomer1 = `${config.external.unsplashBase}/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face`;
const MaleCustomer2 = `${config.external.unsplashBase}/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`;
const MaleCustomer3 = `${config.external.unsplashBase}/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face`;

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Try API first, fallback to static JSON
        const response = await productsApi.getAll();
        if (response.success && response.data.length > 0) {
          setProducts(response.data);
        } else {
          throw new Error('No products from API');
        }
      } catch (error) {
        // Fallback to static JSON
        try {
          const res = await fetch(`${process.env.PUBLIC_URL}/database/database.json`);
          const json = await res.json();
          const allProducts = [
            ...json.female.map((p) => ({ ...p, gender: 'female' })),
            ...json.male.map((p) => ({ ...p, gender: 'male' })),
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

  // Bestsellers (rating >= 4.5)
  const bestsellers = products
    .filter((p) => (p.rating || 0) >= 4.5)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 4);

  // New arrivals (rating === 0 indicates new)
  const newArrivals = products.filter((p) => p.rating === 0).slice(0, 4);

  return (
    <div>
      {/* Hero Section */}
      <div 
        className="relative min-h-[80vh] md:min-h-[95vh] flex flex-col justify-center px-6 md:px-[10%] bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImg})` }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        
        <h1 className="relative z-10 text-4xl md:text-5xl lg:text-7xl w-full md:w-3/4 lg:w-5/12 leading-tight font-semibold text-white mb-6">
          Love the Planet we walk on
        </h1>
        <p className="relative z-10 text-base md:text-lg text-white/90 w-full md:w-3/4 lg:w-5/12 mb-8">
          Bibendum fermentum, aenean donec pretium aliquam blandit tempor imperdiet arcu arcu ut
          nunc in dictum mauris at ut.
        </p>
        <div className="relative z-10 flex flex-col sm:flex-row gap-4">
          <Link to="/men">
            <button className="w-full sm:w-auto bg-white text-dark py-3 px-8 font-semibold hover:bg-primary hover:text-white transition-colors">
              SHOP MEN
            </button>
          </Link>
          <Link to="/women">
            <button className="w-full sm:w-auto bg-white text-dark py-3 px-8 font-semibold hover:bg-primary hover:text-white transition-colors">
              SHOP WOMEN
            </button>
          </Link>
        </div>
      </div>

      {/* As Seen In */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 py-8 px-4 border-b border-light-dark">
        <p className="text-lg font-medium">As seen in:</p>
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          <img src={asSeen1} alt="Media 1" className="h-6 md:h-8 opacity-50" />
          <img src={asSeen2} alt="Media 2" className="h-6 md:h-8 opacity-50" />
          <img src={asSeen3} alt="Media 3" className="h-6 md:h-8 opacity-50" />
          <img src={asSeen4} alt="Media 4" className="h-6 md:h-8 opacity-50" />
          <img src={asSeen5} alt="Media 5" className="h-6 md:h-8 opacity-50" />
        </div>
      </div>

      {/* About Us */}
      <div className="flex flex-col lg:flex-row justify-center items-center gap-8 lg:gap-10 px-6 md:px-10 py-12 md:py-20">
        <img className="w-full lg:w-[40vw] rounded-lg" src={aboutUsImg} alt="About us" />
        <div className="p-4 md:p-10 pt-0 md:pt-5 max-w-full lg:max-w-[50vw]">
          <h6 className="text-lg py-4 md:py-10 text-orange-400">About Us</h6>
          <h2 className="text-3xl md:text-5xl font-semibold pb-6 md:pb-10">
            Selected materials designed for comfort and sustainability
          </h2>
          <p className="text-gray-400">
            Nullam auctor faucibus ridiculus dignissim sed et auctor sed eget auctor nec sed elit
            nunc, magna non urna amet ac neque ut quam enim pretium risus gravida ullamcorper
            adipiscing at ut magna.
          </p>
          <Link to="/ourstory">
            <button className="font-semibold border-b-2 border-orange-400 mt-8 md:mt-10 hover:border-dark transition-colors">
              READ MORE
            </button>
          </Link>
        </div>
      </div>

      {/* See How Made */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-8 py-12 md:py-16 px-6 bg-light mx-4 md:mx-[1.5%] rounded-lg">
        <div className="text-center md:text-left max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">See how our shoes are made</h2>
          <p className="text-gray-500 mb-6">
            Parturient amet sociis tempor quisque vestibulum pulvinar quis at tincidunt tristique
            nullam nunc nulla adipiscing morbi.
          </p>
          <Link to="/ourstory">
            <button className="bg-primary text-white py-3 px-10 font-semibold hover:bg-dark transition-colors">
              DISCOVER
            </button>
          </Link>
        </div>
        <img src={shoes} alt="Shoes" className="w-full max-w-[300px] md:max-w-[400px]" />
      </div>

      {/* Bestsellers */}
      <div className="px-6 md:px-[10%] lg:px-[15%] py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 md:mb-10">Our Bestsellers</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 1 }} />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestsellers.map((product, index) => (
              <ProductCard
                key={product._id || index}
                product={product}
                onQuickView={setQuickViewProduct}
              />
            ))}
          </div>
        )}
      </div>

      {/* Men/Women Routes */}
      <div className="flex flex-col md:flex-row min-h-[60vh] md:h-[70vh] w-full">
        <div
          className="flex-1 flex flex-col justify-center items-center bg-cover bg-center py-20 md:py-0 relative"
          style={{ backgroundImage: `url(${menRouteImg})` }}
        >
          <div className="absolute inset-0 bg-black/30 hover:bg-black/50 transition-colors" />
          <h2 className="relative z-10 text-3xl md:text-4xl font-bold text-white mb-4">Men Collection</h2>
          <Link to="/men" className="relative z-10">
            <button className="border-2 border-white text-white py-3 px-10 font-semibold hover:bg-white hover:text-dark transition-colors">
              SHOP MEN
            </button>
          </Link>
        </div>
        <div
          className="flex-1 flex flex-col justify-center items-center bg-cover bg-center py-20 md:py-0 relative"
          style={{ backgroundImage: `url(${womenRouteImg})` }}
        >
          <div className="absolute inset-0 bg-black/30 hover:bg-black/50 transition-colors" />
          <h2 className="relative z-10 text-3xl md:text-4xl font-bold text-white mb-4">Women Collection</h2>
          <Link to="/women" className="relative z-10">
            <button className="border-2 border-white text-white py-3 px-10 font-semibold hover:bg-white hover:text-dark transition-colors">
              SHOP WOMEN
            </button>
          </Link>
        </div>
      </div>

      {/* New Arrivals */}
      <div className="px-6 md:px-[10%] lg:px-[15%] py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 md:mb-10">Latest Products</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 1 }} />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((product, index) => (
              <ProductCard
                key={product._id || index}
                product={product}
                onQuickView={setQuickViewProduct}
              />
            ))}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-8 md:gap-16 py-12 md:py-16 px-6 bg-light mx-4 md:mx-[1.5%] rounded-lg">
        <div className="text-center max-w-[200px] mx-auto sm:mx-0">
          <img src={RecycledImg} alt="Recycled" className="w-16 mx-auto mb-4" />
          <h4 className="font-semibold mb-2">Recycled Materials</h4>
          <p className="text-gray-500 text-sm">Made from recycled ocean plastics</p>
        </div>
        <div className="text-center max-w-[200px] mx-auto sm:mx-0">
          <img src={VeganImg} alt="Vegan" className="w-16 mx-auto mb-4" />
          <h4 className="font-semibold mb-2">100% Vegan</h4>
          <p className="text-gray-500 text-sm">No animal products used</p>
        </div>
        <div className="text-center max-w-[200px] mx-auto sm:mx-0">
          <img src={handMadeImg} alt="Handmade" className="w-16 mx-auto mb-4" />
          <h4 className="font-semibold mb-2">Handmade</h4>
          <p className="text-gray-500 text-sm">Crafted with care by artisans</p>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-12 md:py-16 px-6 md:px-[10%] lg:px-[15%]">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 md:mb-10">What Our Customers Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            { name: 'James Wilson', img: MaleCustomer1, rating: 5 },
            { name: 'Michael Chen', img: MaleCustomer2, rating: 5 },
            { name: 'David Thompson', img: MaleCustomer3, rating: 4 },
          ].map((testimonial, index) => (
            <div key={index} className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <Avatar
                src={testimonial.img}
                alt={testimonial.name}
                sx={{ width: 80, height: 80, margin: '0 auto 16px' }}
              />
              <Rating value={testimonial.rating} readOnly />
              <p className="text-gray-500 my-4">
                "Amazing quality and super comfortable. Best shoes I've ever owned!"
              </p>
              <h5 className="font-semibold">{testimonial.name}</h5>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="bg-dark py-12 md:py-16 px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">Subscribe to Our Newsletter</h2>
        <p className="text-gray-400 mb-6">Get updates on new arrivals and exclusive offers</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-3 rounded-none border-0 focus:ring-2 focus:ring-primary"
          />
          <button className="bg-primary text-white px-8 py-3 font-semibold hover:bg-primary-hover transition-colors">
            SUBSCRIBE
          </button>
        </div>
        <div className="flex justify-center gap-6 mt-8 text-white text-xl">
          <button className="hover:text-primary transition-colors" aria-label="Instagram">
            <FontAwesomeIcon icon={faInstagram} />
          </button>
          <button className="hover:text-primary transition-colors" aria-label="Pinterest">
            <FontAwesomeIcon icon={faPinterestP} />
          </button>
          <button className="hover:text-primary transition-colors" aria-label="Facebook">
            <FontAwesomeIcon icon={faFacebook} />
          </button>
          <button className="hover:text-primary transition-colors" aria-label="Twitter">
            <FontAwesomeIcon icon={faXTwitter} />
          </button>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}
    </div>
  );
}
