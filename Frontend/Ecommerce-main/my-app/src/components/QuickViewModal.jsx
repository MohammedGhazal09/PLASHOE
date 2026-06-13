import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faStar, faStarHalfAlt, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarEmpty } from '@fortawesome/free-regular-svg-icons';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';

const DEFAULT_SIZES = [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

export default function QuickViewModal({ product, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const { addItem, openCart } = useCartStore();
  const sizes = product?.sizes?.length ? product.sizes : DEFAULT_SIZES;
  const [selectedSize, setSelectedSize] = useState(() => sizes[0]);

  useEffect(() => {
    if (!sizes.includes(selectedSize)) {
      setSelectedSize(sizes[0]);
    }
  }, [selectedSize, sizes]);

  if (!product) return null;

  const price = product.price?.current || 0;
  const originalPrice = product.price?.original || price;
  const hasDiscount = originalPrice > price;
  const image = product.image || '';

  const handleAddToCart = async () => {
    const productData = {
      _id: product.id,
      name: product.name,
      image: image,
      price: {
        current: price,
        original: originalPrice,
      },
    };

    const result = await addItem(productData, quantity, selectedSize);

    if (result.success) {
      toast.success(`${product.name} added to cart!`);
      onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white w-full max-w-4xl mx-4 rounded-lg shadow-xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-800"
        >
          <FontAwesomeIcon icon={faXmark} className="text-2xl" />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="md:w-1/2">
            <img
              src={image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="md:w-1/2 p-8">
            <h2 className="text-2xl font-bold mb-2">{product.name}</h2>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">{renderStars(product.rating || 0)}</div>
              <span className="text-gray-500">({product.rating || 0})</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              {hasDiscount && (
                <span className="text-xl text-gray-400 line-through">
                  ${originalPrice.toFixed(2)}
                </span>
              )}
              <span className={`text-2xl font-bold ${hasDiscount ? 'text-red-500' : ''}`}>
                ${price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="bg-red-500 text-white px-2 py-1 text-sm">
                  {Math.round((1 - price / originalPrice) * 100)}% OFF
                </span>
              )}
            </div>

            {/* Category */}
            <p className="text-gray-500 mb-4">
              Category: <span className="font-semibold">{product.category}</span>
            </p>

            {/* Size Selection */}
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Size:</h4>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-10 h-10 border ${
                      selectedSize === size
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-black'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Quantity:</h4>
              <div className="flex items-center border border-gray-300 w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-gray-100"
                >
                  <FontAwesomeIcon icon={faMinus} />
                </button>
                <span className="px-6 py-2 border-x border-gray-300">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-gray-100"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="w-full bg-[#6e7051] text-white py-4 font-semibold text-lg hover:bg-[#262b2c] transition-colors"
            >
              ADD TO CART - ${(price * quantity).toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
