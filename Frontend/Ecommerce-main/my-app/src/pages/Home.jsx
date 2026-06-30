import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPinterestP, faXTwitter, faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons';
import Rating from '@mui/material/Rating';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { newsletterApi } from '../api/newsletterApi';
import { config } from '../config/config';
import { useCatalogProducts } from '../hooks/useCatalogProducts';

// Import images
import asSeen1 from '../assets/images/asSeen1.png';
import asSeen2 from '../assets/images/asSeen2.png';
import asSeen3 from '../assets/images/asSeen3.png';
import asSeen4 from '../assets/images/asSeen4.png';
import asSeen5 from '../assets/images/asSeen5.png';
import aboutUsImg from '../assets/images/aboutUsImg.jpg';
import shoes from '../assets/images/home-feature-shoes.webp';
import RecycledImg from '../assets/images/RecycledImg.png';
import VeganImg from '../assets/images/VeganImg.png';
import handMadeImg from '../assets/images/handMadeImg.png';
import heroImg from '../assets/images/homePage.webp';
import menRouteImg from '../assets/images/men-collection-hero.webp';
import womenRouteImg from '../assets/images/women-collection-hero.webp';

// External male customer testimonial images - use config
const MaleCustomer1 = `${config.external.unsplashBase}/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face`;
const MaleCustomer2 = `${config.external.unsplashBase}/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`;
const MaleCustomer3 = `${config.external.unsplashBase}/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face`;

export default function Home() {
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState({ type: '', message: '' });
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const { products, loading } = useCatalogProducts({ limit: 100 });

  // Bestsellers (rating >= 4.5)
  const bestsellers = products
    .filter((p) => (p.rating || 0) >= 4.5)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 4);

  // New arrivals (rating === 0 indicates new)
  const newArrivals = products.filter((p) => p.rating === 0).slice(0, 4);

  const handleNewsletterSubmit = async (event) => {
    event.preventDefault();

    if (!newsletterConsent) {
      setNewsletterStatus({
        type: 'error',
        message: 'Confirm newsletter consent before subscribing.',
      });
      return;
    }

    setNewsletterSubmitting(true);
    setNewsletterStatus({ type: '', message: '' });

    try {
      const response = await newsletterApi.subscribe({
        email: newsletterEmail,
        consent: true,
        source: 'home_newsletter',
      });

      if (response?.success) {
        setNewsletterStatus({
          type: 'success',
          message: response.message || 'Newsletter subscription saved.',
        });
        setNewsletterEmail('');
        setNewsletterConsent(false);
      }
    } catch (error) {
      setNewsletterStatus({
        type: 'error',
        message: error.response?.data?.message || 'We could not save your newsletter subscription.',
      });
    } finally {
      setNewsletterSubmitting(false);
    }
  };

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
            <button className="button-control button-control--light button-control--wide button-control--responsive-full">
              SHOP MEN
            </button>
          </Link>
          <Link to="/women">
            <button className="button-control button-control--light button-control--wide button-control--responsive-full">
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
            <button className="button-control button-control--secondary mt-8 md:mt-10">
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
            <button className="button-control button-control--primary button-control--wide">
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
                key={product.id || index}
                product={product}
                onQuickView={setQuickViewProduct}
              />
            ))}
          </div>
        )}
      </div>

      {/* Men/Women Routes */}
      <div className="flex flex-col md:flex-row min-h-[60vh] md:h-[70vh] w-full">
        <div className="flex-1 flex flex-col justify-center items-center overflow-hidden py-20 md:py-0 relative">
          <img
            src={menRouteImg}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: '100% center', transform: 'scaleX(-1)' }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-black/10 hover:from-black/65 hover:via-black/35 hover:to-black/20 transition-colors" />
          <h2 className="relative z-10 text-3xl md:text-4xl font-bold text-white mb-4">Men Collection</h2>
          <Link to="/men" className="relative z-10">
            <button className="button-control button-control--light button-control--wide">
              SHOP MEN
            </button>
          </Link>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center overflow-hidden py-20 md:py-0 relative">
          <img
            src={womenRouteImg}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: '0% center', transform: 'scaleX(-1)' }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black/55 via-black/25 to-black/10 hover:from-black/65 hover:via-black/35 hover:to-black/20 transition-colors" />
          <h2 className="relative z-10 text-3xl md:text-4xl font-bold text-white mb-4">Women Collection</h2>
          <Link to="/women" className="relative z-10">
            <button className="button-control button-control--light button-control--wide">
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
                key={product.id || index}
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
        <form onSubmit={handleNewsletterSubmit} className="mx-auto max-w-xl text-left">
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="newsletter-email">Email</label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={newsletterEmail}
              onChange={(event) => setNewsletterEmail(event.target.value)}
              placeholder="Enter your email"
              aria-describedby="newsletter-consent newsletter-status"
              aria-invalid={newsletterStatus.type === 'error' ? 'true' : undefined}
              className="flex-1 rounded-none border-0 px-4 py-3 focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={newsletterSubmitting}
              className="button-control button-control--primary button-control--wide"
            >
              {newsletterSubmitting ? 'SAVING...' : 'SUBSCRIBE'}
            </button>
          </div>
          <label id="newsletter-consent" className="mt-3 flex items-start gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={newsletterConsent}
              onChange={(event) => setNewsletterConsent(event.target.checked)}
              className="mt-1"
            />
            Email me PLASHOE updates and offers. I can unsubscribe later.
          </label>
          {newsletterStatus.message && (
            <p
              id="newsletter-status"
              role={newsletterStatus.type === 'error' ? 'alert' : 'status'}
              className={`mt-3 text-sm font-semibold ${
                newsletterStatus.type === 'error' ? 'text-red-200' : 'text-green-200'
              }`}
            >
              {newsletterStatus.message}
            </p>
          )}
        </form>
        <div className="flex justify-center gap-6 mt-8 text-white text-xl">
          <button className="button-control button-control--inverse-icon" aria-label="Instagram">
            <FontAwesomeIcon icon={faInstagram} />
          </button>
          <button className="button-control button-control--inverse-icon" aria-label="Pinterest">
            <FontAwesomeIcon icon={faPinterestP} />
          </button>
          <button className="button-control button-control--inverse-icon" aria-label="Facebook">
            <FontAwesomeIcon icon={faFacebook} />
          </button>
          <button className="button-control button-control--inverse-icon" aria-label="Twitter">
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
