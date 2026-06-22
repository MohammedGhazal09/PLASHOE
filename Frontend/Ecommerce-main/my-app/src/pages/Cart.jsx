import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faMinus, faPlus, faShoppingBag } from '@fortawesome/free-solid-svg-icons';
import { hasLocalCartItems, useCartStore, selectSubtotal, selectTotal } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { joinPublicPath } from '../utils/publicPath';

export default function Cart() {
  const location = useLocation();
  const { items, updateItemQuantity, removeItem, clearCart, discount } =
    useCartStore();
  const subtotal = useCartStore(selectSubtotal);
  const total = useCartStore(selectTotal);
  const { isAuthenticated } = useAuthStore();
  const hasUnresolvedLocalItems = isAuthenticated && hasLocalCartItems(items);
  const checkoutReviewMessage = location.state?.checkoutReview;

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 px-6">
        <div className="text-gray-200 mb-6">
          <FontAwesomeIcon icon={faShoppingBag} className="text-8xl" />
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold mb-4 text-center">Your Cart is Empty</h1>
        <p className="text-gray-500 mb-8 text-center">Looks like you haven't added any items yet.</p>
        <Link to="/collection">
          <button className="button-control button-control--primary button-control--wide">
            CONTINUE SHOPPING
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 md:py-10 px-4 md:px-[5%] lg:px-[10%]">
      <h1 className="text-2xl md:text-3xl font-semibold mb-8 md:mb-10">Shopping Cart</h1>

      {(hasUnresolvedLocalItems || checkoutReviewMessage) && (
        <div role="alert" className="mb-6 border border-[#b42318] bg-red-50 p-4 text-sm text-[#b42318]">
          {checkoutReviewMessage ||
            'Some items were saved on this device and need review before checkout.'}
        </div>
      )}

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
            const mutationId = item.cartItemId || item.id;
            return (
            <div
              key={`${item.id}-${item.size}`}
              className="border-b py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
            >
              {/* Product Info */}
              <div className="md:col-span-5 flex gap-4">
                <div className="w-24 h-24 flex-shrink-0 bg-light rounded overflow-hidden">
                  <img
                    src={joinPublicPath(item.image)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="font-semibold text-dark">{item.name}</h3>
                  <p className="text-gray-500 text-sm mb-2">Size: {item.size}</p>
                  <button
                    onClick={() => removeItem(mutationId)}
                    className="button-control button-control--link-danger"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" /> Remove
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="md:col-span-2 flex md:justify-center items-center gap-2">
                <span className="md:hidden text-gray-500 text-sm">Price:</span>
                <span className="font-medium">${item.unitPrice.toFixed(2)}</span>
              </div>

              {/* Quantity */}
              <div className="md:col-span-3 flex items-center md:justify-center gap-2">
                <span className="md:hidden text-gray-500 text-sm mr-2">Qty:</span>
                <button
                  onClick={() =>
                    updateItemQuantity(mutationId, item.quantity - 1)
                  }
                  className="button-control button-control--secondary button-control--icon"
                  disabled={item.quantity <= 1}
                  aria-label={`Decrease ${item.name} quantity`}
                >
                  <FontAwesomeIcon icon={faMinus} className="text-xs" />
                </button>
                <span className="w-10 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() =>
                    updateItemQuantity(mutationId, item.quantity + 1)
                  }
                  className="button-control button-control--secondary button-control--icon"
                  aria-label={`Increase ${item.name} quantity`}
                >
                  <FontAwesomeIcon icon={faPlus} className="text-xs" />
                </button>
              </div>

              {/* Total */}
              <div className="md:col-span-2 flex md:justify-end items-center gap-2">
                <span className="md:hidden text-gray-500 text-sm">Total:</span>
                <span className="font-bold text-dark">${item.lineTotal.toFixed(2)}</span>
              </div>
            </div>
          );
          })}

          <button
            onClick={clearCart}
            className="button-control button-control--link-danger mt-6"
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
            <button className="button-control button-control--primary button-control--full mb-3">
              PROCEED TO CHECKOUT
            </button>
          </Link>

          <Link
            to="/collection"
            className="button-control button-control--secondary button-control--full"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
