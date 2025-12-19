import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faMinus, faPlus, faShoppingBag } from '@fortawesome/free-solid-svg-icons';
import { useCartStore, selectSubtotal, selectTotal } from '../store/cartStore';

// Helper to safely get price from cart item (handles different structures)
const getItemPrice = (item) => {
  if (typeof item.price === 'number') return item.price;
  if (item.price?.current) return item.price.current;
  if (item.priceAtAdd) return item.priceAtAdd;
  if (item.product?.price?.current) return item.product.price.current;
  return 0;
};

// Helper to safely get item details
const getItemDetails = (item) => ({
  id: item.productId || item._id || item.product?._id,
  name: item.name || item.product?.name || 'Product',
  image: item.image || item.product?.image || '',
  size: item.size || 'N/A',
  quantity: item.quantity || 1,
  price: getItemPrice(item),
});

export default function Cart() {
  const { items, updateItemQuantity, removeItem, clearCart, discount } =
    useCartStore();
  const subtotal = useCartStore(selectSubtotal);
  const total = useCartStore(selectTotal);

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 px-6">
        <div className="text-gray-200 mb-6">
          <FontAwesomeIcon icon={faShoppingBag} className="text-8xl" />
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold mb-4 text-center">Your Cart is Empty</h1>
        <p className="text-gray-500 mb-8 text-center">Looks like you haven't added any items yet.</p>
        <Link to="/collection">
          <button className="bg-primary text-white py-3 px-10 font-semibold hover:bg-dark transition-colors">
            CONTINUE SHOPPING
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 md:py-10 px-4 md:px-[5%] lg:px-[10%]">
      <h1 className="text-2xl md:text-3xl font-semibold mb-8 md:mb-10">Shopping Cart</h1>

      <div className="flex gap-8 lg:gap-10 flex-col lg:flex-row">
        {/* Cart Items */}
        <div className="flex-1">
          {/* Table Header - Desktop Only */}
          <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b text-gray-500 font-medium text-sm">
            <span className="col-span-5">Product</span>
            <span className="col-span-2 text-center">Price</span>
            <span className="col-span-3 text-center">Quantity</span>
            <span className="col-span-2 text-right">Total</span>
          </div>

          {items.map((item) => {
            const details = getItemDetails(item);
            return (
            <div
              key={`${details.id}-${details.size}`}
              className="border-b py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
            >
              {/* Product Info */}
              <div className="md:col-span-5 flex gap-4">
                <div className="w-24 h-24 flex-shrink-0 bg-light rounded overflow-hidden">
                  <img
                    src={details.image}
                    alt={details.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="font-semibold text-dark">{details.name}</h3>
                  <p className="text-gray-500 text-sm mb-2">Size: {details.size}</p>
                  <button
                    onClick={() => removeItem(details.id, details.size)}
                    className="text-red-500 text-sm flex items-center gap-1 hover:text-red-700 transition-colors w-fit"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" /> Remove
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="md:col-span-2 flex md:justify-center items-center gap-2">
                <span className="md:hidden text-gray-500 text-sm">Price:</span>
                <span className="font-medium">${details.price.toFixed(2)}</span>
              </div>

              {/* Quantity */}
              <div className="md:col-span-3 flex items-center md:justify-center gap-2">
                <span className="md:hidden text-gray-500 text-sm mr-2">Qty:</span>
                <button
                  onClick={() =>
                    updateItemQuantity(item._id, details.quantity - 1)
                  }
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={details.quantity <= 1}
                >
                  <FontAwesomeIcon icon={faMinus} className="text-xs" />
                </button>
                <span className="w-10 text-center font-medium">{details.quantity}</span>
                <button
                  onClick={() =>
                    updateItemQuantity(item._id, details.quantity + 1)
                  }
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                >
                  <FontAwesomeIcon icon={faPlus} className="text-xs" />
                </button>
              </div>

              {/* Total */}
              <div className="md:col-span-2 flex md:justify-end items-center gap-2">
                <span className="md:hidden text-gray-500 text-sm">Total:</span>
                <span className="font-bold text-dark">${(details.price * details.quantity).toFixed(2)}</span>
              </div>
            </div>
          );
          })}

          <button
            onClick={clearCart}
            className="mt-6 text-gray-500 hover:text-red-500 transition-colors flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faTrash} className="text-sm" />
            Clear Cart
          </button>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-[380px] bg-light p-6 rounded-lg h-fit lg:sticky lg:top-24">
          <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

          <div className="space-y-4 border-b border-gray-200 pb-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({items.length} items)</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span className="font-medium">-${(subtotal * discount / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className="text-green-600 font-medium">Free</span>
            </div>
          </div>

          <div className="flex justify-between font-bold text-xl py-4">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <Link to="/checkout">
            <button className="w-full bg-primary text-white py-4 font-semibold hover:bg-dark transition-colors mb-3">
              PROCEED TO CHECKOUT
            </button>
          </Link>

          <Link
            to="/collection"
            className="block text-center py-3 text-gray-600 hover:text-primary transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
