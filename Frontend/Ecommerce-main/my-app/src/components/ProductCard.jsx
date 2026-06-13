import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faStarHalfAlt } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarEmpty } from '@fortawesome/free-regular-svg-icons';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';

const DEFAULT_SIZES = [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

export default function ProductCard({ product, onQuickView }) {
  const { addItem, openCart } = useCartStore();
  const [isHovered, setIsHovered] = useState(false);

  const price = product.price?.current || 0;
  const originalPrice = product.price?.original || price;
  const hasDiscount = originalPrice > price;
  const image = product.image || '';
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
    <div
      className="relative group bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={product.name}
          className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs font-semibold">
            SALE
          </span>
        )}

        {/* Quick actions on hover */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-white bg-opacity-95 p-4 transition-all duration-300 ${
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          }`}
        >
          <div className="flex gap-2 mb-3">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedSize(size);
                }}
                className={`w-8 h-8 text-xs border ${
                  selectedSize === size
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-black'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-[#6e7051] text-white py-2 text-sm font-semibold hover:bg-[#262b2c] transition-colors"
            >
              ADD TO CART
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                onQuickView?.(product);
              }}
              className="px-4 border border-gray-300 text-gray-600 hover:border-black transition-colors"
            >
              👁
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 text-center">
        <h3 className="font-semibold text-gray-800">{product.name}</h3>
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
