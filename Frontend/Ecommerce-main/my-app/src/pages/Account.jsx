import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faBox,
  faHeart,
  faSignOutAlt,
  faCog,
  faChevronRight,
  faFilter,
  faSave,
  faPlus,
  faStar,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { hasLocalCartItems, useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { ordersApi } from '../api/ordersApi';
import { config } from '../config/config';
import { getPaymentStatusLabel } from '../utils/paymentStatus';
import { joinPublicPath } from '../utils/publicPath';

const emptyAddressForm = {
  firstName: '',
  lastName: '',
  company: '',
  country: 'United States',
  street: '',
  apartment: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  isDefault: false,
};

export default function Account() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    isAuthenticated,
    logout,
    updateProfile,
    addAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAuthStore();
  const wishlistItems = useWishlistStore((state) => state.items);
  const wishlistLoading = useWishlistStore((state) => state.isLoading);
  const wishlistError = useWishlistStore((state) => state.error);
  const syncWishlist = useWishlistStore((state) => state.syncWishlist);
  const mergeLocalWishlist = useWishlistStore((state) => state.mergeLocalWishlist);
  const removeWishlistItem = useWishlistStore((state) => state.removeItem);
  const addCartItem = useCartStore((state) => state.addItem);
  const mergeLocalCart = useCartStore((state) => state.mergeLocalCart);
  const checkoutReturnPath = location.state?.from?.pathname;
  const hasCheckoutIntent = Boolean(checkoutReturnPath?.startsWith('/checkout'));

  const [activeTab, setActiveTab] = useState(location.state?.tab || 'profile');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [wishlistSizes, setWishlistSizes] = useState({});
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressActionId, setAddressActionId] = useState(null);

  // Login/Register form states
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (isAuthenticated && activeTab === 'orders') {
      loadOrders();
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'wishlist' && config.features.wishlist) {
      syncWishlist();
    }
  }, [activeTab, isAuthenticated, syncWishlist]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    setProfileForm({
      name: user.name || '',
      phone: user.phone || '',
    });
  }, [isAuthenticated, user?._id, user?.name, user?.phone]);

  useEffect(() => {
    setWishlistSizes((current) => {
      const next = { ...current };
      wishlistItems.forEach((item) => {
        if (!next[item.productId] && item.sizes?.length > 0) {
          next[item.productId] = item.sizes[0];
        }
      });
      return next;
    });
  }, [wishlistItems]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await ordersApi.getAll();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleAddressChange = (e) => {
    const { checked, name, type, value } = e.target;

    setAddressForm({
      ...addressForm,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!profileForm.name.trim()) {
      toast.error('Full name is required');
      return;
    }

    setSavingProfile(true);
    const result = await updateProfile({
      name: profileForm.name,
      phone: profileForm.phone,
    });
    setSavingProfile(false);

    if (result.success) {
      toast.success('Profile updated.');
    } else {
      toast.error(result.message || 'We could not update your profile.');
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();

    setSavingAddress(true);
    const result = await addAddress({
      ...addressForm,
      isDefault: addressForm.isDefault || (user?.addresses || []).length === 0,
    });
    setSavingAddress(false);

    if (result.success) {
      setAddressForm(emptyAddressForm);
      toast.success('Address saved.');
    } else {
      toast.error(result.message || 'We could not save this address.');
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    setAddressActionId(addressId);
    const result = await setDefaultAddress(addressId);
    setAddressActionId(null);

    if (result.success) {
      toast.success('Default address updated.');
    } else {
      toast.error(result.message || 'We could not update your default address.');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    const confirmed = window.confirm('Delete this saved address?');
    if (!confirmed) return;

    setAddressActionId(addressId);
    const result = await deleteAddress(addressId);
    setAddressActionId(null);

    if (result.success) {
      toast.success('Address deleted.');
    } else {
      toast.error(result.message || 'We could not delete this address.');
    }
  };

  const reconcileAfterAuth = async ({ hadLocalWishlist, hadLocalCart }) => {
    let cartMergeResult = { success: true };

    if (hadLocalCart) {
      cartMergeResult = await mergeLocalCart();
      if (cartMergeResult.success && cartMergeResult.merged > 0) {
        toast.success('Cart saved to your account.');
      } else if (!cartMergeResult.success) {
        toast.error(cartMergeResult.message || 'Some cart items need review before checkout.');
      }
    }

    if (hadLocalWishlist) {
      const mergeResult = await mergeLocalWishlist();
      if (mergeResult.success && mergeResult.merged > 0) {
        toast.success('Wishlist saved to your account.');
      } else if (!mergeResult.success) {
        toast.error(mergeResult.message);
      }
    } else {
      await syncWishlist();
    }

    await useAuthStore.getState().fetchUser();

    if (hasCheckoutIntent) {
      if (cartMergeResult.success) {
        navigate(checkoutReturnPath, { replace: true });
      } else {
        navigate('/cart', {
          replace: true,
          state: { checkoutReview: cartMergeResult.message },
        });
      }
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();

    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const hadLocalWishlist = useWishlistStore
          .getState()
          .items.some((item) => item.source === 'local');
        const hadLocalCart = hasLocalCartItems(useCartStore.getState().items);
        const result = await useAuthStore.getState().login(formData.email, formData.password);
        if (result.success) {
          toast.success('Welcome back!');
          await reconcileAfterAuth({ hadLocalWishlist, hadLocalCart });
        } else {
          toast.error(result.message || 'Login failed');
        }
      } else {
        const hadLocalWishlist = useWishlistStore
          .getState()
          .items.some((item) => item.source === 'local');
        const hadLocalCart = hasLocalCartItems(useCartStore.getState().items);
        const result = await useAuthStore.getState().register(formData.name, formData.email, formData.password);
        if (result.success) {
          toast.success('Account created successfully!');
          await reconcileAfterAuth({ hadLocalWishlist, hadLocalCart });
        } else {
          toast.error(result.message || 'Registration failed');
        }
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleRemoveWishlistItem = async (productId) => {
    const confirmed = window.confirm('Remove: This item will leave your wishlist. Continue?');
    if (!confirmed) return;

    const result = await removeWishlistItem(productId);
    if (result.success) {
      toast.success('Removed from wishlist.');
    } else {
      toast.error(result.message || 'We could not remove this item.');
    }
  };

  const handleMoveToCart = async (item) => {
    const selectedSize = wishlistSizes[item.productId] || item.sizes?.[0];

    if (!selectedSize) {
      toast.error('Select a size before moving this item to cart.');
      return;
    }

    const productData = {
      _id: item.productId,
      name: item.name,
      image: item.image,
      price: item.price,
    };
    const result = await addCartItem(productData, 1, Number(selectedSize));

    if (result.success) {
      await removeWishlistItem(item.productId);
      toast.success(`${item.name} moved to cart.`);
    } else {
      toast.error(result.message || 'We could not move this item to your cart. It is still saved.');
    }
  };

  const addresses = user?.addresses || [];

  // Not authenticated - show login/register
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-semibold text-center mb-8">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>

          {hasCheckoutIntent && (
            <p role="status" className="mb-6 border border-[#d9d9d2] bg-[#f1f1ef] p-4 text-center text-sm text-[#262b2c]">
              Sign in to save your cart and continue to secure checkout.
            </p>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border px-4 py-3"
                  required={!isLogin}
                />
              </div>
            )}
            <div>
              <label className="block text-gray-600 mb-1">Email</label>
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
              <label className="block text-gray-600 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border px-4 py-3"
                required
              />
            </div>
            {!isLogin && (
              <div>
                <label className="block text-gray-600 mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full border px-4 py-3"
                  required={!isLogin}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="auth-submit-button"
            >
              {loading ? 'PLEASE WAIT...' : isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-500">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="auth-switch-button"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>

          {config.features.wishlist && wishlistItems.length > 0 && (
            <p className="mt-6 text-center text-sm text-gray-500">
              Saved on this device. Sign in to keep it across devices.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Authenticated - show account dashboard
  return (
    <div className="min-h-screen py-10 px-[5%] lg:px-[10%]">
      <h1 className="text-3xl font-semibold mb-10">My Account</h1>

      <div className="flex gap-10 flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-[250px]">
          <div className="bg-[#f1f1ef] p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-[#6e7051] text-white flex items-center justify-center text-2xl mx-auto mb-3">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <h3 className="font-semibold">{user?.name}</h3>
              <p className="text-gray-500 text-sm">{user?.email}</p>
            </div>

            <nav className="space-y-2">
              {[
                { id: 'profile', icon: faUser, label: 'Profile' },
                { id: 'orders', icon: faBox, label: 'Orders' },
                ...(config.features.wishlist
                  ? [{ id: 'wishlist', icon: faHeart, label: 'Wishlist' }]
                  : []),
                { id: 'settings', icon: faCog, label: 'Settings' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#6e7051] text-white'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <FontAwesomeIcon icon={tab.icon} />
                  {tab.label}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="button-control button-control--danger button-control--full button-control--start"
              >
                <FontAwesomeIcon icon={faSignOutAlt} />
                Logout
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    className="w-full border px-4 py-3 bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="w-full border px-4 py-3 bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">My Orders</h2>
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border px-3 py-2 rounded text-sm"
                  >
                    <option value="all">All Orders</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              {loading ? (
                <div className="text-center py-10">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>No orders yet</p>
                  <Link to="/collection">
                    <button className="button-control button-control--primary mt-4">
                      Start Shopping
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders
                    .filter((order) => statusFilter === 'all' || order.status === statusFilter)
                    .map((order) => (
                    <Link
                      key={order._id}
                      to={`/order/${order._id}`}
                      className="block border p-4 rounded hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-semibold">Order #{order.orderNumber || order._id.slice(-8)}</p>
                          <p className="text-gray-500 text-sm">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                          {order.paymentStatus && (
                            <p className="text-gray-500 text-sm">
                              {getPaymentStatusLabel(order.paymentStatus)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded text-sm ${
                              order.status === 'delivered'
                                ? 'bg-green-100 text-green-600'
                                : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-600'
                                : order.status === 'shipped'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-yellow-100 text-yellow-600'
                            }`}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <FontAwesomeIcon icon={faChevronRight} className="text-gray-400" />
                        </div>
                      </div>
                      <div className="flex gap-4 overflow-x-auto pb-2">
                        {order.items.slice(0, 4).map((item, idx) => (
                          <img
                            key={idx}
                            src={joinPublicPath(item.image || item.productImage)}
                            alt={item.name || item.productName}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ))}
                        {order.items.length > 4 && (
                          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-500 text-sm">
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t">
                        <div className="text-gray-500 text-sm">
                          <span>{order.items.length} item(s)</span>
                          {order.items.length > 0 && (
                            <span className="ml-2">
                              • {order.items.map(i => i.name || i.productName).slice(0, 2).join(', ')}
                              {order.items.length > 2 && '...'}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold">${order.total.toFixed(2)}</span>
                      </div>
                    </Link>
                  ))}
                  {orders.filter((order) => statusFilter === 'all' || order.status === statusFilter).length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                      <p>No {statusFilter} orders found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Wishlist Tab */}
          {config.features.wishlist && activeTab === 'wishlist' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">My Wishlist</h2>
              {wishlistError && (
                <p role="alert" className="mb-4 text-sm font-medium text-[#b42318]">
                  We could not load your wishlist. Check your connection and try again.
                </p>
              )}
              {wishlistLoading ? (
                <p role="status" className="text-gray-500">Loading wishlist...</p>
              ) : wishlistItems.length === 0 ? (
                <div className="py-10 text-center text-gray-500">
                  <p className="text-lg font-semibold text-[#262b2c]">Your wishlist is empty</p>
                  <p className="mt-2">Save products while browsing and they will appear here.</p>
                  <Link
                    to="/collection"
                    className="button-control button-control--primary mt-4"
                  >
                    Browse products
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {wishlistItems.map((item) => {
                    const selectedSize = wishlistSizes[item.productId] || item.sizes?.[0] || '';
                    const stockLabel = item.stock > 0 ? `${item.stock} in stock` : 'Out of stock';

                    return (
                      <div
                        key={item.productId}
                        className="grid gap-4 border border-[#d9d9d2] p-4 md:grid-cols-[96px_1fr_auto] md:items-center"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-24 w-24 object-cover"
                        />
                        <div>
                          <h3 className="font-semibold text-[#262b2c]">{item.name}</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            ${Number(item.price?.current || 0).toFixed(2)}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">{stockLabel}</p>
                          {item.source === 'local' && (
                            <p className="mt-2 text-xs text-gray-500">
                              Saved on this device. Sign in to keep it across devices.
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                          <label className="text-sm font-semibold text-[#262b2c]">
                            Size for {item.name}
                            <select
                              value={selectedSize}
                              onChange={(event) =>
                                setWishlistSizes((current) => ({
                                  ...current,
                                  [item.productId]: event.target.value,
                                }))
                              }
                              className="mt-1 block min-h-[44px] w-full border border-gray-300 px-3 py-2 text-sm font-normal"
                            >
                              {(item.sizes || []).map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleMoveToCart(item)}
                            disabled={!selectedSize || item.stock === 0}
                            className="button-control button-control--dark button-control--full wishlist-move-button"
                          >
                            Move to cart
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveWishlistItem(item.productId)}
                            className="button-control button-control--danger button-control--full"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-10">
              <h2 className="text-xl font-semibold">Account Settings</h2>

              <section aria-labelledby="profile-settings-heading" className="border-b border-[#d9d9d2] pb-8">
                <div className="mb-5">
                  <h3 id="profile-settings-heading" className="text-lg font-semibold text-[#262b2c]">
                    Profile details
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Keep your checkout contact details current.
                  </p>
                </div>

                <form aria-label="Profile settings" onSubmit={handleProfileSubmit} className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-semibold text-[#262b2c]">
                    Full name
                    <input
                      type="text"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      className="mt-1 w-full border border-gray-300 px-4 py-3 font-normal"
                      required
                    />
                  </label>

                  <label className="block text-sm font-semibold text-[#262b2c]">
                    Phone
                    <input
                      type="tel"
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                      className="mt-1 w-full border border-gray-300 px-4 py-3 font-normal"
                    />
                  </label>

                  <label className="block text-sm font-semibold text-[#262b2c] md:col-span-2">
                    Email
                    <input
                      type="email"
                      value={user?.email || ''}
                      className="mt-1 w-full border border-gray-300 bg-gray-50 px-4 py-3 font-normal text-gray-500"
                      aria-describedby="account-email-help"
                      readOnly
                    />
                  </label>
                  <p id="account-email-help" className="text-sm text-gray-500 md:col-span-2">
                    Email changes require a verified account flow and are not available here.
                  </p>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="button-control button-control--primary"
                    >
                      <FontAwesomeIcon icon={faSave} aria-hidden="true" />
                      {savingProfile ? 'Saving...' : 'Save profile'}
                    </button>
                  </div>
                </form>
              </section>

              <section aria-labelledby="address-book-heading" className="border-b border-[#d9d9d2] pb-8">
                <div className="mb-5">
                  <h3 id="address-book-heading" className="text-lg font-semibold text-[#262b2c]">
                    Address book
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your default address is used first during checkout.
                  </p>
                </div>

                <form aria-label="Add saved address" onSubmit={handleAddressSubmit} className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-semibold text-[#262b2c]">
                    First name
                    <input
                      type="text"
                      name="firstName"
                      value={addressForm.firstName}
                      onChange={handleAddressChange}
                      className="mt-1 w-full border border-gray-300 px-4 py-3 font-normal"
                      required
                    />
                  </label>

                  <label className="block text-sm font-semibold text-[#262b2c]">
                    Last name
                    <input
                      type="text"
                      name="lastName"
                      value={addressForm.lastName}
                      onChange={handleAddressChange}
                      className="mt-1 w-full border border-gray-300 px-4 py-3 font-normal"
                      required
                    />
                  </label>

                  <label className="block text-sm font-semibold text-[#262b2c]">
                    Company
                    <input
                      type="text"
                      name="company"
                      value={addressForm.company}
                      onChange={handleAddressChange}
                      className="mt-1 w-full border border-gray-300 px-4 py-3 font-normal"
                    />
                  </label>

                  <label className="block text-sm font-semibold text-[#262b2c]">
                    Country
                    <input
                      type="text"
                      name="country"
                      value={addressForm.country}
                      onChange={handleAddressChange}
                      className="mt-1 w-full border border-gray-300 px-4 py-3 font-normal"
                      required
                    />
                  </label>

                  <label className="block text-sm font-semibold text-[#262b2c] md:col-span-2">
                    Street address
                    <input
                      type="text"
                      name="street"
                      value={addressForm.street}
                      onChange={handleAddressChange}
                      className="mt-1 w-full border border-gray-300 px-4 py-3 font-normal"
                      required
                    />
                  </label>

                  <label className="block text-sm font-semibold text-[#262b2c]">
                    Apartment, suite, etc.
                    <input
                      type="text"
                      name="apartment"
                      value={addressForm.apartment}
                      onChange={handleAddressChange}
                      className="mt-1 w-full border border-gray-300 px-4 py-3 font-normal"
                    />
                  </label>

                  <label className="block text-sm font-semibold text-[#262b2c]">
                    City
                    <input
                      type="text"
                      name="city"
                      value={addressForm.city}
                      onChange={handleAddressChange}
                      className="mt-1 w-full border border-gray-300 px-4 py-3 font-normal"
                      required
                    />
                  </label>

                  <label className="block text-sm font-semibold text-[#262b2c]">
                    State
                    <input
                      type="text"
                      name="state"
                      value={addressForm.state}
                      onChange={handleAddressChange}
                      className="mt-1 w-full border border-gray-300 px-4 py-3 font-normal"
                      required
                    />
                  </label>

                  <label className="block text-sm font-semibold text-[#262b2c]">
                    ZIP or postal code
                    <input
                      type="text"
                      name="zipCode"
                      value={addressForm.zipCode}
                      onChange={handleAddressChange}
                      className="mt-1 w-full border border-gray-300 px-4 py-3 font-normal"
                      required
                    />
                  </label>

                  <label className="block text-sm font-semibold text-[#262b2c]">
                    Delivery phone
                    <input
                      type="tel"
                      name="phone"
                      value={addressForm.phone}
                      onChange={handleAddressChange}
                      className="mt-1 w-full border border-gray-300 px-4 py-3 font-normal"
                      required
                    />
                  </label>

                  <label className="flex items-center gap-3 text-sm font-semibold text-[#262b2c] md:col-span-2">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={addressForm.isDefault}
                      onChange={handleAddressChange}
                      className="h-5 w-5 accent-[#6e7051]"
                    />
                    Use as default shipping address
                  </label>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={savingAddress}
                      className="button-control button-control--primary"
                    >
                      <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
                      {savingAddress ? 'Saving...' : 'Add address'}
                    </button>
                  </div>
                </form>

                <div className="mt-8">
                  {addresses.length === 0 ? (
                    <p role="status" className="text-sm text-gray-500">
                      No saved addresses yet.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {addresses.map((address, index) => {
                        const addressId = address._id || `${index}`;
                        const label = `${address.firstName || 'Saved'} ${address.lastName || 'address'}`.trim();
                        const actionInProgress = addressActionId === addressId;

                        return (
                          <li key={addressId} className="border border-[#d9d9d2] p-4">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-[#262b2c]">{label}</p>
                                  {address.isDefault && (
                                    <span className="inline-flex items-center gap-1 border border-[#6e7051] px-2 py-1 text-xs font-semibold text-[#4f513c]">
                                      <FontAwesomeIcon icon={faStar} aria-hidden="true" />
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="mt-2 text-sm text-gray-600">{address.street}</p>
                                {address.apartment && (
                                  <p className="text-sm text-gray-600">{address.apartment}</p>
                                )}
                                <p className="text-sm text-gray-600">
                                  {[address.city, address.state, address.zipCode].filter(Boolean).join(', ')}
                                </p>
                                <p className="text-sm text-gray-600">{address.country}</p>
                                <p className="mt-2 text-sm text-gray-600">{address.phone}</p>
                              </div>
                              <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
                                {!address.isDefault && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetDefaultAddress(addressId)}
                                    disabled={actionInProgress || !address._id}
                                    aria-label={`Set default address for ${label}`}
                                    className="button-control button-control--secondary button-control--compact"
                                  >
                                    <FontAwesomeIcon icon={faStar} aria-hidden="true" />
                                    Set default
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAddress(addressId)}
                                  disabled={actionInProgress || !address._id}
                                  aria-label={`Delete address for ${label}`}
                                  className="button-control button-control--danger button-control--compact"
                                >
                                  <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>

              <section aria-labelledby="security-settings-heading">
                <h3 id="security-settings-heading" className="text-lg font-semibold text-[#262b2c]">
                  Sign-in security
                </h3>
                <p id="credential-help" className="mt-2 text-sm text-gray-500">
                  Password changes require current-password verification or a reset-token flow and are not available in this settings workflow.
                </p>
                <button
                  type="button"
                  disabled
                  aria-describedby="credential-help"
                  className="button-control button-control--secondary button-control--disabled mt-4"
                >
                  Password change unavailable
                </button>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
