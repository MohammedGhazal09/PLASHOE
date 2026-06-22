import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faTruck, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { ordersApi } from '../api/ordersApi';
import { returnsApi } from '../api/returnsApi';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import TrackingTimeline from '../components/TrackingTimeline';
import { getPaymentStatusLabel, isPaymentCancellationLocked } from '../utils/paymentStatus';
import { joinPublicPath } from '../utils/publicPath';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const syncCart = useCartStore((state) => state.syncCart);
  const openCart = useCartStore((state) => state.openCart);

  const [order, setOrder] = useState(null);
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returnLoading, setReturnLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnForm, setReturnForm] = useState({
    type: 'return',
    orderItemId: '',
    quantity: 1,
    reason: '',
    exchangeSize: '',
    customerNotes: '',
  });

  const loadReturnRequests = useCallback(async () => {
    setReturnLoading(true);
    try {
      const response = await returnsApi.getMine({ orderId: id });
      if (response.success) {
        setReturnRequests(response.data || []);
      }
    } catch {
      setReturnRequests([]);
    } finally {
      setReturnLoading(false);
    }
  }, [id]);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ordersApi.getById(id);
      if (response.success) {
        const nextOrder = response.data;
        setOrder(nextOrder);
        const firstItem = nextOrder.items?.[0];
        if (firstItem?._id) {
          setReturnForm((current) => ({
            ...current,
            orderItemId: current.orderItemId || firstItem._id,
          }));
        }
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
    loadReturnRequests();
  }, [isAuthenticated, loadOrder, loadReturnRequests, navigate]);

  const canRequestReturn =
    order &&
    order.status === 'delivered' &&
    Boolean(order.deliveredAt) &&
    ['paid', 'not_required'].includes(order.paymentStatus || 'not_required');

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

  const handleReorder = async () => {
    setReordering(true);
    try {
      const response = await ordersApi.reorder(id);
      if (response.success) {
        await syncCart();
        openCart();
        toast.success(`${response.data?.added || 0} item(s) moved to cart.`);
        if (response.data?.skipped?.length > 0) {
          toast.error('Some items are no longer available and were skipped.');
        }
      } else {
        toast.error(response.message || 'No items are available to reorder.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'No items are available to reorder.');
    } finally {
      setReordering(false);
    }
  };

  const handleReturnSubmit = async (event) => {
    event.preventDefault();

    if (!returnForm.orderItemId || !returnForm.reason.trim()) {
      toast.error('Choose an item and reason before submitting');
      return;
    }

    if (returnForm.type === 'exchange' && !returnForm.exchangeSize) {
      toast.error('Choose a desired exchange size');
      return;
    }

    setReturnSubmitting(true);
    try {
      const itemPayload = {
        orderItemId: returnForm.orderItemId,
        quantity: Number(returnForm.quantity || 1),
        reason: returnForm.reason,
      };

      if (returnForm.type === 'exchange') {
        itemPayload.exchangeSize = Number(returnForm.exchangeSize);
      }

      const response = await returnsApi.create({
        orderId: id,
        type: returnForm.type,
        items: [itemPayload],
        customerNotes: returnForm.customerNotes || undefined,
      });

      if (response.success) {
        toast.success('Return request submitted');
        setReturnForm((current) => ({
          ...current,
          reason: '',
          exchangeSize: '',
          customerNotes: '',
        }));
        await loadReturnRequests();
      } else {
        toast.error(response.message || 'Return request failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Return request failed');
    } finally {
      setReturnSubmitting(false);
    }
  };

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
          <button className="button-control button-control--secondary">Back to Orders</button>
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
          className="button-control button-control--secondary button-control--icon"
          aria-label="Back to orders"
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

          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Returns & Exchanges</h2>
            {returnLoading ? (
              <p role="status" className="text-sm text-gray-600">Loading return requests...</p>
            ) : returnRequests.length > 0 ? (
              <div className="space-y-3">
                {returnRequests.map((request) => (
                  <div key={request._id} className="border border-gray-200 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-dark">{request.requestNumber}</p>
                      <span className="text-gray-600">{request.status}</span>
                    </div>
                    <p className="mt-1 text-gray-600">
                      {request.type} request for {(request.items || []).reduce((total, item) => total + Number(item.quantity || 0), 0)} item(s)
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No return or exchange requests for this order.</p>
            )}

            {canRequestReturn ? (
              <form onSubmit={handleReturnSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-dark">
                  Request type
                  <select
                    value={returnForm.type}
                    onChange={(event) => setReturnForm((current) => ({ ...current, type: event.target.value }))}
                    className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="return">Return</option>
                    <option value="exchange">Exchange</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-dark">
                  Item
                  <select
                    value={returnForm.orderItemId}
                    onChange={(event) => setReturnForm((current) => ({ ...current, orderItemId: event.target.value }))}
                    className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
                  >
                    {(order.items || []).map((item) => (
                      <option key={item._id || item.name} value={item._id}>
                        {item.productName || item.name} - size {item.size}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-dark">
                  Quantity
                  <input
                    type="number"
                    min="1"
                    value={returnForm.quantity}
                    onChange={(event) => setReturnForm((current) => ({ ...current, quantity: event.target.value }))}
                    className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                {returnForm.type === 'exchange' && (
                  <label className="text-sm font-semibold text-dark">
                    Desired size
                    <input
                      type="number"
                      min="1"
                      value={returnForm.exchangeSize}
                      onChange={(event) => setReturnForm((current) => ({ ...current, exchangeSize: event.target.value }))}
                      className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
                    />
                  </label>
                )}
                <label className="text-sm font-semibold text-dark md:col-span-2">
                  Reason
                  <input
                    value={returnForm.reason}
                    onChange={(event) => setReturnForm((current) => ({ ...current, reason: event.target.value }))}
                    className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Fit, damage, wrong item, or another issue"
                  />
                </label>
                <label className="text-sm font-semibold text-dark md:col-span-2">
                  Notes
                  <textarea
                    value={returnForm.customerNotes}
                    onChange={(event) => setReturnForm((current) => ({ ...current, customerNotes: event.target.value }))}
                    className="mt-1 min-h-24 w-full border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={returnSubmitting}
                    className="button-control button-control--primary button-control--compact"
                  >
                    {returnSubmitting ? 'Submitting...' : 'Submit return request'}
                  </button>
                </div>
              </form>
            ) : (
              <p className="mt-5 border border-gray-200 bg-[#f1f1ef] p-3 text-sm text-gray-600">
                This order is not currently eligible for a return or exchange. Eligible orders must be delivered, within the return window, and in a refundable payment state.
              </p>
            )}
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
          <button
            type="button"
            onClick={handleReorder}
            disabled={reordering}
            className="button-control button-control--primary button-control--full"
          >
            {reordering ? 'ADDING TO CART...' : 'BUY AGAIN'}
          </button>

          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="button-control button-control--danger button-control--full"
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
