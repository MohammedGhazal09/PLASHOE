import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { hasLocalCartItems, useCartStore, selectSubtotal, selectTotal } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { ordersApi } from '../api/ordersApi';
import { joinPublicPath } from '../utils/publicPath';

const createIdempotencyKey = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  if (window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const splitName = (name = '') => {
  const [firstName = '', ...rest] = name.trim().split(/\s+/).filter(Boolean);
  return { firstName, lastName: rest.join(' ') };
};

const getPreferredAddress = (addresses = []) =>
  addresses.find((address) => address.isDefault) || addresses[0] || null;

const buildFormDataFromUser = (user) => {
  const preferredAddress = getPreferredAddress(user?.addresses || []);
  const name = splitName(user?.name || '');

  return {
    firstName: preferredAddress?.firstName || name.firstName || '',
    lastName: preferredAddress?.lastName || name.lastName || '',
    email: user?.email || '',
    phone: preferredAddress?.phone || user?.phone || '',
    address: preferredAddress?.street || '',
    city: preferredAddress?.city || '',
    state: preferredAddress?.state || '',
    zipCode: preferredAddress?.zipCode || '',
    country: preferredAddress?.country || 'United States',
  };
};

export default function Checkout() {
  const navigate = useNavigate();
  const { items, discount, couponCode, applyCoupon, mergeLocalCart } = useCartStore();
  const subtotal = useCartStore(selectSubtotal);
  const total = useCartStore(selectTotal);
  const { isAuthenticated, user, addAddress } = useAuthStore();

  const [couponInput, setCouponInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const [cartReviewMessage, setCartReviewMessage] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);
  const checkoutAttemptKeyRef = useRef(null);
  const [formData, setFormData] = useState(() => buildFormDataFromUser(user));

  useEffect(() => {
    const nextFormData = buildFormDataFromUser(user);

    setFormData((current) => ({
      firstName: current.firstName || nextFormData.firstName,
      lastName: current.lastName || nextFormData.lastName,
      email: current.email || nextFormData.email,
      phone: current.phone || nextFormData.phone,
      address: current.address || nextFormData.address,
      city: current.city || nextFormData.city,
      state: current.state || nextFormData.state,
      zipCode: current.zipCode || nextFormData.zipCode,
      country: current.country || nextFormData.country,
    }));
  }, [user]);

  // Sync or merge cart with backend on mount
  useEffect(() => {
    let cancelled = false;

    const doSync = async () => {
      if (isAuthenticated) {
        const result = await mergeLocalCart();
        if (!cancelled) {
          setCartReviewMessage(result.success ? '' : result.message || 'Review your cart before checkout.');
        }
      }
      if (!cancelled) {
        setSyncing(false);
      }
    };
    doSync();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, mergeLocalCart]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    const result = await applyCoupon(couponInput);
    if (result.success) {
      toast.success(`Coupon applied! ${result.discount}% off`);
      setCouponInput('');
    } else {
      toast.error(result.message || 'Invalid coupon');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please log in to checkout');
      navigate('/account', { state: { from: { pathname: '/checkout' } }, replace: true });
      return;
    }

    if (hasLocalCartItems(items)) {
      toast.error('Review your cart before starting payment');
      return;
    }

    // Validate form
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    for (const field of required) {
      if (!formData[field]) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return;
      }
    }

    setLoading(true);

    try {
      // Sync or merge cart with backend first to ensure consistency
      const mergeResult = await mergeLocalCart();
      if (!mergeResult.success) {
        setCartReviewMessage(mergeResult.message || 'Review your cart before checkout.');
        toast.error('Review your cart before starting payment');
        return;
      }
      if (!checkoutAttemptKeyRef.current) {
        checkoutAttemptKeyRef.current = createIdempotencyKey();
      }

      const shippingAddress = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        street: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        phone: formData.phone,
      };

      // Prepare order data - backend uses server-side cart, we just send shipping info
      const orderData = {
        shippingAddress,
        notes: undefined,
      };

      // Submit to API
      const response = await ordersApi.create(orderData, checkoutAttemptKeyRef.current);
      const checkoutUrl = response?.data?.payment?.checkoutUrl;
      if (response.success && checkoutUrl) {
        if (saveAddress) {
          const saveResult = await addAddress({ ...shippingAddress, isDefault: true });
          if (!saveResult.success) {
            toast.error(saveResult.message || 'Address could not be saved');
          }
        }
        checkoutAttemptKeyRef.current = null;
        window.location.assign(checkoutUrl);
      } else {
        toast.error(response.message || 'Failed to start payment');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error.response?.data?.message || 'Something went wrong. Please try again.';
      if (error.response?.status === 409) {
        checkoutAttemptKeyRef.current = null;
        await mergeLocalCart();
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  

  if (syncing) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <div className="text-gray-500">Loading cart...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-20">
        <h1 className="text-3xl font-semibold mb-4">Your Cart is Empty</h1>
        <p className="text-gray-500 mb-8">Add some items to checkout.</p>
        <Link to="/collection">
          <button className="bg-[#6e7051] text-white py-3 px-10 font-semibold">
            SHOP NOW
          </button>
        </Link>
      </div>
    );
  }

  const discountAmount = subtotal * discount / 100;
  const hasUnresolvedLocalItems = isAuthenticated && hasLocalCartItems(items);

  return (
    <div className="min-h-screen py-10 px-[5%] lg:px-[10%]">
      <h1 className="text-3xl font-semibold mb-10">Checkout</h1>

      {hasUnresolvedLocalItems && (
        <div role="alert" className="mb-6 border border-[#b42318] bg-red-50 p-4 text-sm text-[#b42318]">
          {cartReviewMessage || 'Some cart items need review before payment. Return to cart, update items, and try again.'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-10 flex-col lg:flex-row">
        {/* Shipping Form */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-6">Shipping Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600 mb-1">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full border px-4 py-3"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full border px-4 py-3"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border px-4 py-3"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Phone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border px-4 py-3"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-600 mb-1">Address *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border px-4 py-3"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full border px-4 py-3"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">State *</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full border px-4 py-3"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">ZIP Code *</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className="w-full border px-4 py-3"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Country</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full border px-4 py-3"
              >
                <option>United States</option>
                <option>Canada</option>
                <option>United Kingdom</option>
                <option>Germany</option>
                <option>France</option>
              </select>
            </div>
            <label className="md:col-span-2 flex items-center gap-3 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(event) => setSaveAddress(event.target.checked)}
                className="h-4 w-4"
              />
              Save this address for next time
            </label>
          </div>

          {/* Payment Info */}
          <h2 className="text-xl font-semibold mt-10 mb-6">Payment Method</h2>
          <div className="bg-[#f1f1ef] p-6 rounded">
            <p className="text-gray-600">
              Card payment opens in a secure hosted checkout.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Your order updates after payment confirmation.
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-[400px]">
          <div className="bg-[#f1f1ef] p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

            {/* Items */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto mb-6">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex gap-4">
                  <img
                    src={joinPublicPath(item.image)}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-gray-500 text-xs">
                      Size: {item.size} | Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="font-medium">${item.lineTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="border-t pt-4 mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="flex-1 border px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="bg-gray-800 text-white px-4 py-2 text-sm hover:bg-black"
                >
                  Apply
                </button>
              </div>
              {couponCode && (
                <p className="text-green-600 text-sm mt-2">Coupon "{couponCode}" applied!</p>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({discount}% off)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || hasUnresolvedLocalItems}
              className={`w-full py-4 font-semibold mt-6 transition-colors ${
                loading || hasUnresolvedLocalItems
                  ? 'bg-gray-800 text-white cursor-not-allowed'
                  : 'bg-[#6e7051] text-white hover:bg-[#262b2c]'
              }`}
            >
              {hasUnresolvedLocalItems ? 'REVIEW CART BEFORE PAYMENT' : loading ? 'PROCESSING...' : 'CONTINUE TO PAYMENT'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
