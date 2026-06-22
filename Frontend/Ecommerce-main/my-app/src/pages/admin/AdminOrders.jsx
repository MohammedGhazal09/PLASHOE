import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';

const orderStatuses = ['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const paymentStatuses = [
  '',
  'requires_payment',
  'payment_pending',
  'paid',
  'payment_failed',
  'payment_canceled',
  'refunded',
  'not_required',
];
const fulfillmentStatuses = ['processing', 'shipped', 'delivered'];

const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not set' : date.toLocaleDateString();
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1, limit: 20 });
  const [filters, setFilters] = useState({ q: '', status: '', paymentStatus: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [fulfillment, setFulfillment] = useState({
    status: 'processing',
    carrier: '',
    trackingNumber: '',
    description: '',
    location: '',
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const loadOrders = async (page = meta.page || 1) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: meta.limit || 20,
        q: filters.q || undefined,
        status: filters.status || undefined,
        paymentStatus: filters.paymentStatus || undefined,
      };
      const response = await adminApi.getOrders(params);
      setOrders(response.data || []);
      setMeta({
        total: response.total || 0,
        page: response.page || page,
        pages: response.pages || 1,
        limit: response.limit || params.limit,
      });
    } catch (err) {
      setError(getErrorMessage(err, 'We could not load this admin data. Check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    void loadOrders(1);
  };

  const openOrder = async (id) => {
    setSelectedOrder(null);
    setDetailLoading(true);
    setDetailError('');
    setNotice('');
    try {
      const response = await adminApi.getOrder(id);
      const order = response.data;
      setSelectedOrder(order);
      setFulfillment({
        status: order?.status && fulfillmentStatuses.includes(order.status) ? order.status : 'processing',
        carrier: order?.carrier || '',
        trackingNumber: order?.trackingNumber || '',
        description: '',
        location: '',
      });
    } catch (err) {
      setDetailError(getErrorMessage(err, 'We could not load this order.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFulfillmentSubmit = async (event) => {
    event.preventDefault();
    if (!selectedOrder?._id) return;

    setSaving(true);
    setDetailError('');
    setNotice('');
    try {
      const payload = {
        status: fulfillment.status,
        carrier: fulfillment.carrier || undefined,
        trackingNumber: fulfillment.trackingNumber || undefined,
        description: fulfillment.description || undefined,
        location: fulfillment.location || undefined,
      };
      const response = await adminApi.updateOrderFulfillment(selectedOrder._id, payload);
      setSelectedOrder(response.data);
      setNotice(response.message || 'Fulfillment updated');
      void loadOrders(meta.page);
    } catch (err) {
      setDetailError(getErrorMessage(err, 'Fulfillment update failed.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <header className="border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase text-primary">Operations</p>
        <h2 className="mt-1 text-xl font-semibold text-dark">Orders</h2>
        <p className="mt-1 text-sm text-gray-600">{meta.total} total orders</p>
      </header>

      <form onSubmit={handleFilterSubmit} className="grid gap-3 border border-gray-200 bg-white p-4 md:grid-cols-4">
        <label className="text-sm font-semibold text-dark">
          Search
          <input
            value={filters.q}
            onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
            placeholder="Order, name, or email"
          />
        </label>
        <label className="text-sm font-semibold text-dark">
          Status
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
          >
            {orderStatuses.map((status) => (
              <option key={status || 'all'} value={status}>
                {status || 'All statuses'}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-dark">
          Payment
          <select
            value={filters.paymentStatus}
            onChange={(event) => setFilters((current) => ({ ...current, paymentStatus: event.target.value }))}
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
          >
            {paymentStatuses.map((status) => (
              <option key={status || 'all'} value={status}>
                {status || 'All payments'}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button type="submit" className="button-control button-control--primary button-control--full button-control--compact">
            Apply filters
          </button>
        </div>
      </form>

      {error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p role="status" className="border border-gray-200 bg-white p-4 text-sm text-gray-600">
          Loading orders...
        </p>
      ) : orders.length === 0 ? (
        <section className="border border-gray-200 bg-white p-8 text-center">
          <h3 className="text-lg font-semibold text-dark">No orders match these filters</h3>
          <p className="mt-2 text-sm text-gray-600">Adjust filters or clear the search to review recent orders.</p>
        </section>
      ) : (
        <div className="overflow-x-auto border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-light text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Fulfillment</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="px-4 py-3 font-semibold text-dark">{order.orderNumber || order._id}</td>
                  <td className="px-4 py-3 text-gray-700">{order.user?.email || order.user?.name || 'Guest'}</td>
                  <td className="px-4 py-3 text-gray-700">{order.paymentStatus || 'not_required'}</td>
                  <td className="px-4 py-3 text-gray-700">{order.status}</td>
                  <td className="px-4 py-3 text-gray-700">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openOrder(order._id)}
                      className="button-control button-control--secondary button-control--compact"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between border border-gray-200 bg-white p-3 text-sm text-gray-600">
        <button
          type="button"
          disabled={meta.page <= 1 || loading}
          onClick={() => loadOrders(meta.page - 1)}
          className="button-control button-control--pagination button-control--compact"
        >
          Previous
        </button>
        <span>
          Page {meta.page} of {meta.pages}
        </span>
        <button
          type="button"
          disabled={meta.page >= meta.pages || loading}
          onClick={() => loadOrders(meta.page + 1)}
          className="button-control button-control--pagination button-control--compact"
        >
          Next
        </button>
      </div>

      <section className="border border-gray-200 bg-white p-4">
        <h3 className="text-lg font-semibold text-dark">Order detail</h3>
        {detailLoading && <p role="status" className="mt-3 text-sm text-gray-600">Loading order detail...</p>}
        {detailError && <p className="mt-3 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{detailError}</p>}
        {notice && <p className="mt-3 border border-green-200 bg-green-50 p-3 text-sm text-green-700">{notice}</p>}
        {!detailLoading && !selectedOrder && !detailError && (
          <p className="mt-3 text-sm text-gray-600">Select an order to inspect fulfillment and customer details.</p>
        )}
        {selectedOrder && (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="space-y-3 text-sm text-gray-700">
              <p><span className="font-semibold text-dark">Order:</span> {selectedOrder.orderNumber || selectedOrder._id}</p>
              <p><span className="font-semibold text-dark">Customer:</span> {selectedOrder.user?.email || selectedOrder.user?.name || 'Guest'}</p>
              <p><span className="font-semibold text-dark">Payment:</span> {selectedOrder.paymentStatus}</p>
              <p><span className="font-semibold text-dark">Total:</span> {formatCurrency(selectedOrder.total)}</p>
              <p><span className="font-semibold text-dark">Shipping:</span> {selectedOrder.shippingAddress?.address || selectedOrder.shippingAddress?.city || 'Not provided'}</p>
              <div>
                <p className="font-semibold text-dark">Items</p>
                <ul className="mt-1 space-y-1">
                  {(selectedOrder.items || []).map((item) => (
                    <li key={item._id || item.product || item.name}>
                      {item.name || item.product?.name || 'Item'} x {item.quantity || 1}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <form onSubmit={handleFulfillmentSubmit} className="space-y-3 border border-gray-200 p-4">
              <label className="block text-sm font-semibold text-dark">
                Fulfillment status
                <select
                  value={fulfillment.status}
                  onChange={(event) => setFulfillment((current) => ({ ...current, status: event.target.value }))}
                  className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
                >
                  {fulfillmentStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-dark">
                Carrier
                <input
                  value={fulfillment.carrier}
                  onChange={(event) => setFulfillment((current) => ({ ...current, carrier: event.target.value }))}
                  className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-semibold text-dark">
                Tracking number
                <input
                  value={fulfillment.trackingNumber}
                  onChange={(event) => setFulfillment((current) => ({ ...current, trackingNumber: event.target.value }))}
                  className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-semibold text-dark">
                Note
                <input
                  value={fulfillment.description}
                  onChange={(event) => setFulfillment((current) => ({ ...current, description: event.target.value }))}
                  className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <button type="submit" disabled={saving} className="button-control button-control--primary button-control--full button-control--compact">
                {saving ? 'Saving...' : 'Update fulfillment'}
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
