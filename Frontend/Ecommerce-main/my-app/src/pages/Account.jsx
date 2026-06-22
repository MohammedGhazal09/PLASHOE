import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faBox, faHeart, faSignOutAlt, faCog, faChevronRight, faFilter } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { hasLocalCartItems, useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { ordersApi } from '../api/ordersApi';
import { config } from '../config/config';
import { getPaymentStatusLabel } from '../utils/paymentStatus';
import { joinPublicPath } from '../utils/publicPath';

export default function Account() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
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
            <div>
              <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
              <p className="text-gray-500">Settings coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
