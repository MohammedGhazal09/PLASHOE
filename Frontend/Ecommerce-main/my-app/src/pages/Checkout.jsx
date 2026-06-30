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

const formatCurrency = (amount = 0) => `$${Number(amount || 0).toFixed(2)}`;

const formatShippingPrice = (amount = 0) =>
  Number(amount || 0) === 0 ? 'Free' : formatCurrency(amount);

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
  const [shippingOptions, setShippingOptions] = useState(null);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState('');
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const checkoutAttemptKeyRef = useRef(null);
  const [formData, setFormData] = useState(() => buildFormDataFromUser(user));
  const hasUnresolvedLocalItems = isAuthenticated && hasLocalCartItems(items);

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

  useEffect(() => {
    if (
      syncing ||
      !isAuthenticated ||
      items.length === 0 ||
      hasUnresolvedLocalItems ||
      !formData.country
    ) {
      setShippingOptions(null);
      setSelectedShippingMethodId('');
      setShippingError('');
      setShippingLoading(false);
      return;
    }

    let cancelled = false;

    const loadShippingOptions = async () => {
      setShippingLoading(true);
      setShippingError('');

      try {
        const response = await ordersApi.getShippingOptions(formData.country);
        const options = response.data;
        const defaultMethodId =
          options.defaultMethodId || options.methods?.[0]?.id || '';

        if (!cancelled) {
          setShippingOptions(options);
          setSelectedShippingMethodId((current) =>
            options.methods?.some((method) => method.id === current)
              ? current
              : defaultMethodId
          );
        }
      } catch (error) {
        if (!cancelled) {
          setShippingOptions(null);
          setSelectedShippingMethodId('');
          setShippingError(
            error.response?.data?.message ||
              `Shipping is unavailable for ${formData.country}. Choose another country.`
          );
        }
      } finally {
        if (!cancelled) {
          setShippingLoading(false);
        }
      }
    };

    loadShippingOptions();

    return () => {
      cancelled = true;
    };
  }, [
    discount,
    formData.country,
    hasUnresolvedLocalItems,
    isAuthenticated,
    items.length,
    subtotal,
    syncing,
  ]);

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

    if (shippingLoading) {
      toast.error('Shipping rates are still loading');
      return;
    }

    const selectedShippingMethod = shippingOptions?.methods?.find(
      (method) => method.id === selectedShippingMethodId
    );

    if (shippingError || !selectedShippingMethod) {
      toast.error(shippingError || 'Choose an available shipping method');
      return;
    }

    // Validate form
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country'];
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
        shippingMethodId: selectedShippingMethod.id,
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
          <button className="button-control button-control--primary button-control--wide">
            SHOP NOW
          </button>
        </Link>
      </div>
    );
  }

  const discountAmount = subtotal * discount / 100;
  const selectedShippingMethod = shippingOptions?.methods?.find(
    (method) => method.id === selectedShippingMethodId
  );
  const shippingPrice = selectedShippingMethod?.price ?? 0;
  const checkoutTotal = total + shippingPrice;
  const shippingBlocked =
    isAuthenticated &&
    !hasUnresolvedLocalItems &&
    (shippingLoading || Boolean(shippingError) || !selectedShippingMethod);
  const paymentDisabled = loading || hasUnresolvedLocalItems || shippingBlocked;
  const paymentButtonText = hasUnresolvedLocalItems
    ? 'REVIEW CART BEFORE PAYMENT'
    : shippingError
      ? 'SHIPPING UNAVAILABLE'
      : shippingLoading
        ? 'CHECKING SHIPPING'
        : loading
          ? 'PROCESSING...'
          : 'CONTINUE TO PAYMENT';

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
              <label htmlFor="checkout-first-name" className="block text-gray-600 mb-1">First Name *</label>
              <input
                id="checkout-first-name"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full border px-4 py-3"
                required
              />
            </div>
            <div>
              <label htmlFor="checkout-last-name" className="block text-gray-600 mb-1">Last Name *</label>
              <input
                id="checkout-last-name"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full border px-4 py-3"
                required
              />
            </div>
            <div>
              <label htmlFor="checkout-email" className="block text-gray-600 mb-1">Email *</label>
              <input
                id="checkout-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border px-4 py-3"
                required
              />
            </div>
            <div>
              <label htmlFor="checkout-phone" className="block text-gray-600 mb-1">Phone *</label>
              <input
                id="checkout-phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border px-4 py-3"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="checkout-address" className="block text-gray-600 mb-1">Address *</label>
              <input
                id="checkout-address"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border px-4 py-3"
                required
              />
            </div>
            <div>
              <label htmlFor="checkout-city" className="block text-gray-600 mb-1">City *</label>
              <input
                id="checkout-city"
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full border px-4 py-3"
                required
              />
            </div>
            <div>
              <label htmlFor="checkout-state" className="block text-gray-600 mb-1">State *</label>
              <input
                id="checkout-state"
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full border px-4 py-3"
                required
              />
            </div>
            <div>
              <label htmlFor="checkout-zip-code" className="block text-gray-600 mb-1">ZIP Code *</label>
              <input
                id="checkout-zip-code"
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className="w-full border px-4 py-3"
                required
              />
            </div>
            <div>
              <label htmlFor="checkout-country" className="block text-gray-600 mb-1">Country *</label>
              <select
                id="checkout-country"
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
                <option>Australia</option>
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

          <h2 className="text-xl font-semibold mt-10 mb-6">Shipping Method</h2>
          <div className="space-y-3">
            {shippingLoading && (
              <div className="border border-gray-200 bg-white p-4 text-sm text-gray-600">
                Checking shipping rates...
              </div>
            )}

            {shippingError && (
              <div role="alert" className="border border-[#b42318] bg-red-50 p-4 text-sm text-[#b42318]">
                {shippingError}
              </div>
            )}

            {!shippingLoading && !shippingError && shippingOptions?.methods?.length > 0 && (
              <div role="radiogroup" aria-label="Shipping method" className="space-y-3">
                {shippingOptions.methods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex cursor-pointer items-start gap-3 border bg-white p-4 ${
                      selectedShippingMethodId === method.id
                        ? 'border-black'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shippingMethodId"
                      value={method.id}
                      checked={selectedShippingMethodId === method.id}
                      onChange={() => setSelectedShippingMethodId(method.id)}
                      className="mt-1 h-4 w-4"
                    />
                    <span className="flex flex-1 flex-col gap-1">
                      <span className="flex items-center justify-between gap-4">
                        <span className="font-medium">{method.name}</span>
                        <span className="font-medium">{formatShippingPrice(method.price)}</span>
                      </span>
                      <span className="text-sm text-gray-500">{method.estimatedDelivery}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
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
            <p className="text-gray-500 text-sm mt-2">
              Demo deployments may open a mock gateway with approve, decline, and cancel outcomes.
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
                  aria-label="Coupon code"
                  placeholder="Coupon code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="flex-1 border px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="button-control button-control--dark button-control--compact"
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
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({discount}% off)</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className={shippingError ? 'text-[#b42318]' : 'text-green-600'}>
                  {shippingLoading
                    ? 'Checking'
                    : shippingError
                      ? 'Unavailable'
                      : selectedShippingMethod
                        ? formatShippingPrice(shippingPrice)
                        : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>{selectedShippingMethod ? formatCurrency(checkoutTotal) : formatCurrency(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={paymentDisabled}
              className={`button-control button-control--dark button-control--full checkout-payment-button ${
                paymentDisabled ? 'button-control--disabled checkout-payment-button--disabled' : ''
              }`}
            >
              {paymentButtonText}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
