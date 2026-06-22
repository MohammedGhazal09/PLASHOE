import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faStarHalfAlt } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarEmpty } from '@fortawesome/free-regular-svg-icons';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';
import WishlistButton from './WishlistButton';

const DEFAULT_SIZES = [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

export default function ProductCard({ product, onQuickView }) {
  const { addItem, openCart } = useCartStore();

  const price = product.price?.current || 0;
  const originalPrice = product.price?.original || price;
  const hasDiscount = originalPrice > price;
  const image = product.image || '';
  const productLink = product.id ? `/products/${product.id}` : null;
  const sizes = product.sizes?.length ? product.sizes : DEFAULT_SIZES;
  const [selectedSize, setSelectedSize] = useState(() => sizes[0]);

  useEffect(() => {
    if (!sizes.includes(selectedSize)) {
      setSelectedSize(sizes[0]);
    }
  }, [selectedSize, sizes]);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const productData = {
      _id: product.id,
      name: product.name,
      image: image,
      price: {
        current: price,
        original: originalPrice,
      },
    };

    const result = await addItem(productData, 1, selectedSize);
    
    if (result.success) {
      toast.success(`${product.name} added to cart!`);
      openCart();
    } else {
      toast.error(result.message || 'Failed to add to cart');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FontAwesomeIcon key={`full-${i}`} icon={faStar} className="text-yellow-400" />);
    }
    if (hasHalf) {
      stars.push(<FontAwesomeIcon key="half" icon={faStarHalfAlt} className="text-yellow-400" />);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<FontAwesomeIcon key={`empty-${i}`} icon={faStarEmpty} className="text-yellow-400" />);
    }
    return stars;
  };

  return (
    <div className="relative group bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative overflow-hidden">
        {productLink ? (
          <Link to={productLink} aria-label={`View ${product.name}`}>
            <img
              src={image}
              alt={product.name}
              className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
        ) : (
          <img
            src={image}
            alt={product.name}
            className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs font-semibold">
            SALE
          </span>
        )}

        <WishlistButton
          product={product}
          className="absolute right-2 top-2 z-10 rounded-full bg-white/95 p-0 shadow-sm"
        />

        <div className="border-x border-b border-gray-100 bg-white p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedSize(size);
                }}
                className={`choice-button ${selectedSize === size ? 'choice-button--selected' : ''}`}
              >
                {size}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAddToCart}
              className="button-control button-control--primary button-control--compact"
            >
              ADD TO CART
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                onQuickView?.(product);
              }}
              className="button-control button-control--secondary button-control--compact"
              aria-label={`Quick view ${product.name}`}
            >
              Quick view
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 text-center">
        <h3 className="font-semibold text-gray-800">
          {productLink ? (
            <Link to={productLink} className="hover:text-[#6e7051] focus:outline-none focus:ring-2 focus:ring-[#6e7051] focus:ring-offset-2">
              {product.name}
            </Link>
          ) : (
            product.name
          )}
        </h3>
        <div className="flex justify-center gap-1 my-1">
          {renderStars(product.rating || 0)}
        </div>
        <div className="flex justify-center gap-2">
          {hasDiscount && (
            <span className="text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
          )}
          <span className={hasDiscount ? 'text-red-500 font-semibold' : 'text-gray-600'}>
            ${price.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
