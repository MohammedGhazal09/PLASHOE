import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faBox, faHeart, faSignOutAlt, faCog, faChevronRight, faFilter } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { ordersApi } from '../api/ordersApi';

export default function Account() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState(location.state?.tab || 'profile');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

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

  const handleAuth = async (e) => {
    e.preventDefault();

    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const result = await useAuthStore.getState().login(formData.email, formData.password);
        if (result.success) {
          toast.success('Welcome back!');
        } else {
          toast.error(result.message || 'Login failed');
        }
      } else {
        const result = await useAuthStore.getState().register(formData.name, formData.email, formData.password);
        if (result.success) {
          toast.success('Account created successfully!');
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

  // Not authenticated - show login/register
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-semibold text-center mb-8">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>

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
              className="w-full bg-[#6e7051] text-white py-3 font-semibold hover:bg-[#262b2c] transition-colors disabled:opacity-50"
            >
              {loading ? 'PLEASE WAIT...' : isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-500">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#6e7051] font-semibold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
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
                { id: 'wishlist', icon: faHeart, label: 'Wishlist' },
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
                className="w-full text-left px-4 py-3 flex items-center gap-3 text-red-500 hover:bg-red-50"
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
                    <button className="mt-4 bg-[#6e7051] text-white px-6 py-2 hover:bg-[#262b2c]">
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
                            src={item.image || item.productImage}
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
          {activeTab === 'wishlist' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">My Wishlist</h2>
              <p className="text-gray-500">Your wishlist is empty</p>
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
