import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import toast from 'react-hot-toast';
import { config } from '../config/config';
import { useWishlistStore } from '../store/wishlistStore';

export default function WishlistButton({
  product,
  className = '',
  showText = false,
  stopPropagation = true,
}) {
  const [isBusy, setIsBusy] = useState(false);
  const isSaved = useWishlistStore((state) => state.isSaved);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  if (!config.features.wishlist || !product) {
    return null;
  }

  const saved = isSaved(product);
  const productName = product.name || 'this product';
  const label = saved
    ? `Remove ${productName} from wishlist`
    : `Save ${productName} to wishlist`;
  const visibleLabel = saved ? 'Saved' : 'Save for later';

  const handleClick = async (event) => {
    if (stopPropagation) {
      event.preventDefault();
      event.stopPropagation();
    }

    setIsBusy(true);
    const result = await toggleWishlist(product);
    setIsBusy(false);

    if (result.success) {
      const message =
        result.message ||
        (saved ? `${productName} removed from wishlist.` : `${productName} saved to wishlist.`);
      toast.success(message);
    } else {
      toast.error(result.message || 'We could not update your wishlist.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isBusy}
      aria-label={label}
      aria-pressed={saved}
      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#262b2c] transition-colors hover:border-[#6e7051] hover:text-[#6e7051] focus:outline-none focus:ring-2 focus:ring-[#6e7051] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <FontAwesomeIcon
        icon={saved ? faHeartSolid : faHeartRegular}
        className={saved ? 'text-[#b42318]' : 'text-current'}
        aria-hidden="true"
      />
      {showText && <span>{isBusy ? 'Saving...' : visibleLabel}</span>}
    </button>
  );
}
