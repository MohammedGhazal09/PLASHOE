import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCartStore, selectSubtotal, selectTotal } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { ordersApi } from '../api/ordersApi';

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

export default function Checkout() {
  const navigate = useNavigate();
  const { items, discount, couponCode, applyCoupon, clearCart, syncCart } = useCartStore();
  const subtotal = useCartStore(selectSubtotal);
  const total = useCartStore(selectTotal);
  const { isAuthenticated, user } = useAuthStore();

  const [couponInput, setCouponInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    phone: '',
    address: user?.addresses?.[0]?.street || '',
    city: user?.addresses?.[0]?.city || '',
    state: user?.addresses?.[0]?.state || '',
    zipCode: user?.addresses?.[0]?.zipCode || '',
    country: user?.addresses?.[0]?.country || 'United States',
  });

  // Sync cart with backend on mount
  useEffect(() => {
    const doSync = async () => {
      if (isAuthenticated) {
        await syncCart();
      }
      setSyncing(false);
    };
    doSync();
  }, [isAuthenticated, syncCart]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    const result = await applyCoupon(couponInput);
    if (result.success) {
      toast.success(`Coupon applied! ${result.discount}% off`);
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
      // Sync cart with backend first to ensure consistency
      if (isAuthenticated) {
        await syncCart();
      }

      // Prepare order data - backend uses server-side cart, we just send shipping info
      const orderData = {
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          phone: formData.phone,
        },
        notes: undefined,
      };

      if (isAuthenticated) {
        // Submit to API
        const response = await ordersApi.create(orderData);
        if (response.success) {
          clearCart();
          toast.success('Order placed successfully!');
          navigate('/account', { state: { tab: 'orders' } });
        } else {
          toast.error(response.message || 'Failed to place order');
        }
      } else {
        // Mock order for guests
        clearCart();
        toast.success('Order placed successfully! Create an account to track your orders.');
        navigate('/');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error.response?.data?.message || 'Something went wrong. Please try again.';
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

  return (
    <div className="min-h-screen py-10 px-[5%] lg:px-[10%]">
      <h1 className="text-3xl font-semibold mb-10">Checkout</h1>

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
          </div>

          {/* Payment Info (Mock) */}
          <h2 className="text-xl font-semibold mt-10 mb-6">Payment Method</h2>
          <div className="bg-[#f1f1ef] p-6 rounded">
            <p className="text-gray-600">
              💳 This is a demo store. No real payment will be processed.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Your order will be automatically confirmed.
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-[400px]">
          <div className="bg-[#f1f1ef] p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

            {/* Items */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto mb-6">
              {items.map((item) => {
                const details = getItemDetails(item);
                return (
                  <div key={`${details.id}-${details.size}`} className="flex gap-4">
                    <img
                      src={details.image}
                      alt={details.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{details.name}</h4>
                      <p className="text-gray-500 text-xs">
                        Size: {details.size} | Qty: {details.quantity}
                      </p>
                    </div>
                    <span className="font-medium">${(details.price * details.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
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
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
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
              disabled={loading}
              className="w-full bg-[#6e7051] text-white py-4 font-semibold mt-6 hover:bg-[#262b2c] transition-colors disabled:opacity-50"
            >
              {loading ? 'PROCESSING...' : 'PLACE ORDER'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
