import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faTruck, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { ordersApi } from '../api/ordersApi';
import { useAuthStore } from '../store/authStore';
import TrackingTimeline from '../components/TrackingTimeline';
import { getPaymentStatusLabel, isPaymentCancellationLocked } from '../utils/paymentStatus';
import { joinPublicPath } from '../utils/publicPath';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ordersApi.getById(id);
      if (response.success) {
        setOrder(response.data);
      } else {
        toast.error('Order not found');
        navigate('/account', { state: { tab: 'orders' } });
      }
    } catch (error) {
      toast.error('Failed to load order');
      navigate('/account', { state: { tab: 'orders' } });
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/account');
      return;
    }
    loadOrder();
  }, [isAuthenticated, loadOrder, navigate]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setCancelling(true);
    try {
      const response = await ordersApi.cancel(id);
      if (response.success) {
        toast.success('Order cancelled successfully');
        setOrder({ ...order, status: 'cancelled' });
      } else {
        toast.error(response.message || 'Failed to cancel order');
      }
    } catch (error) {
      toast.error('Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const canCancel =
    order &&
    !['shipped', 'delivered', 'cancelled'].includes(order.status) &&
    !isPaymentCancellationLocked(order.paymentStatus);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold mb-4">Order Not Found</h1>
        <Link to="/account" state={{ tab: 'orders' }}>
          <button className="text-[#6e7051] hover:underline">Back to Orders</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-[5%] lg:px-[10%]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/account', { state: { tab: 'orders' } })}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold">Order #{order.orderNumber || order._id.slice(-8)}</h1>
          <p className="text-gray-500 text-sm">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <span
          className={`ml-auto px-4 py-2 rounded text-sm font-medium ${
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tracking Timeline */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Order Status</h2>
            <TrackingTimeline
              status={order.status}
              trackingHistory={order.trackingHistory}
              createdAt={order.createdAt}
            />

            {/* Tracking Number */}
            {order.trackingNumber && (
              <div className="flex items-center gap-3 mt-4 p-4 bg-[#f1f1ef] rounded">
                <FontAwesomeIcon icon={faTruck} className="text-[#6e7051]" />
                <div>
                  <p className="text-sm text-gray-500">Tracking Number</p>
                  <p className="font-medium">{order.trackingNumber}</p>
                  {order.carrier && <p className="text-sm text-gray-500">via {order.carrier}</p>}
                </div>
              </div>
            )}

            {/* Estimated Delivery */}
            {order.estimatedDeliveryDate && order.status !== 'delivered' && order.status !== 'cancelled' && (
              <div className="mt-4 p-4 bg-blue-50 rounded">
                <p className="text-sm text-blue-600">
                  Estimated Delivery: {new Date(order.estimatedDeliveryDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Items ({order.items.length})</h2>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                  <img
                    src={joinPublicPath(item.productImage || item.image)}
                    alt={item.productName || item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{item.productName || item.name}</h4>
                    <p className="text-gray-500 text-sm">Size: {item.size}</p>
                    <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-gray-400 text-sm">${item.price.toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#6e7051]" />
              Shipping Address
            </h2>
            <div className="text-gray-600 text-sm space-y-1">
              <p className="font-medium text-black">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </p>
              <p>{order.shippingAddress.street}</p>
              {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              <p className="pt-2">{order.shippingAddress.phone}</p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                  <span>-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-3 border-t">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
              {order.paymentStatus && (
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-gray-500">Payment</span>
                  <span>{getPaymentStatusLabel(order.paymentStatus)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cancel Button */}
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full py-3 border-2 border-red-500 text-red-500 font-semibold rounded hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {cancelling ? 'CANCELLING...' : 'CANCEL ORDER'}
            </button>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-[#f1f1ef] p-4 rounded">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Note:</span> {order.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
