import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';

const requestStatuses = ['', 'requested', 'approved', 'rejected', 'received', 'resolved', 'cancelled'];
const requestTypes = ['', 'return', 'exchange'];
const adminActions = ['approved', 'rejected', 'received', 'resolved'];

const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not set' : date.toLocaleDateString();
};

const getItemCount = (request) =>
  (request.items || []).reduce((total, item) => total + Number(item.quantity || 0), 0);

export default function AdminReturns() {
  const [requests, setRequests] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1, limit: 20 });
  const [filters, setFilters] = useState({ q: '', status: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [notice, setNotice] = useState('');
  const [action, setAction] = useState({ status: 'approved', note: '', refundAmount: '' });
  const [saving, setSaving] = useState(false);

  const loadRequests = async (page = meta.page || 1) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: meta.limit || 20,
        q: filters.q || undefined,
        status: filters.status || undefined,
        type: filters.type || undefined,
      };
      const response = await adminApi.getReturns(params);
      setRequests(response.data || []);
      setMeta({
        total: response.total || 0,
        page: response.page || page,
        pages: response.pages || 1,
        limit: response.limit || params.limit,
      });
    } catch (err) {
      setError(getErrorMessage(err, 'We could not load return requests.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    void loadRequests(1);
  };

  const openRequest = async (id) => {
    setSelectedRequest(null);
    setDetailLoading(true);
    setDetailError('');
    setNotice('');
    try {
      const response = await adminApi.getReturn(id);
      setSelectedRequest(response.data);
      setAction({ status: 'approved', note: '', refundAmount: '' });
    } catch (err) {
      setDetailError(getErrorMessage(err, 'We could not load this return request.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleActionSubmit = async (event) => {
    event.preventDefault();
    if (!selectedRequest?._id) return;

    setSaving(true);
    setDetailError('');
    setNotice('');
    try {
      const payload = {
        status: action.status,
        note: action.note || undefined,
        refundAmount: action.refundAmount === '' ? undefined : Number(action.refundAmount),
      };
      const response = await adminApi.updateReturnStatus(selectedRequest._id, payload);
      setSelectedRequest(response.data);
      setNotice(response.message || 'Return request updated');
      void loadRequests(meta.page);
    } catch (err) {
      setDetailError(getErrorMessage(err, 'Return request update failed.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <header className="border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase text-primary">Operations</p>
        <h2 className="mt-1 text-xl font-semibold text-dark">Returns</h2>
        <p className="mt-1 text-sm text-gray-600">{meta.total} total requests</p>
      </header>

      <form onSubmit={handleFilterSubmit} className="grid gap-3 border border-gray-200 bg-white p-4 md:grid-cols-4">
        <label className="text-sm font-semibold text-dark">
          Search
          <input
            value={filters.q}
            onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
            placeholder="RMA or order number"
          />
        </label>
        <label className="text-sm font-semibold text-dark">
          Status
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
          >
            {requestStatuses.map((status) => (
              <option key={status || 'all'} value={status}>
                {status || 'All statuses'}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-dark">
          Type
          <select
            value={filters.type}
            onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
          >
            {requestTypes.map((type) => (
              <option key={type || 'all'} value={type}>
                {type || 'All types'}
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

      {error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p role="status" className="border border-gray-200 bg-white p-4 text-sm text-gray-600">
          Loading return requests...
        </p>
      ) : requests.length === 0 ? (
        <section className="border border-gray-200 bg-white p-8 text-center">
          <h3 className="text-lg font-semibold text-dark">No return requests match these filters</h3>
          <p className="mt-2 text-sm text-gray-600">Adjust filters or clear the search to review recent requests.</p>
        </section>
      ) : (
        <div className="overflow-x-auto border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-light text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((request) => (
                <tr key={request._id}>
                  <td className="px-4 py-3 font-semibold text-dark">{request.requestNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{request.user?.email || request.user?.name || 'Unknown'}</td>
                  <td className="px-4 py-3 text-gray-700">{request.orderNumber || request.order?.orderNumber || 'Not set'}</td>
                  <td className="px-4 py-3 text-gray-700">{request.type}</td>
                  <td className="px-4 py-3 text-gray-700">{request.status}</td>
                  <td className="px-4 py-3 text-gray-700">{getItemCount(request)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatCurrency(request.refundIntent?.requestedAmount)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openRequest(request._id)}
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

      <section className="border border-gray-200 bg-white p-4">
        <h3 className="text-lg font-semibold text-dark">Return detail</h3>
        {detailLoading && <p role="status" className="mt-3 text-sm text-gray-600">Loading return detail...</p>}
        {detailError && <p role="alert" className="mt-3 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{detailError}</p>}
        {notice && <p className="mt-3 border border-green-200 bg-green-50 p-3 text-sm text-green-700">{notice}</p>}
        {!detailLoading && !selectedRequest && !detailError && (
          <p className="mt-3 text-sm text-gray-600">Select a request to inspect status history and resolution.</p>
        )}
        {selectedRequest && (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="space-y-3 text-sm text-gray-700">
              <p><span className="font-semibold text-dark">Request:</span> {selectedRequest.requestNumber}</p>
              <p><span className="font-semibold text-dark">Order:</span> {selectedRequest.orderNumber || selectedRequest.order?.orderNumber}</p>
              <p><span className="font-semibold text-dark">Customer:</span> {selectedRequest.user?.email || selectedRequest.user?.name || 'Unknown'}</p>
              <p><span className="font-semibold text-dark">Status:</span> {selectedRequest.status}</p>
              <p><span className="font-semibold text-dark">Refund intent:</span> {selectedRequest.refundIntent?.status || 'not_applicable'} ({formatCurrency(selectedRequest.refundIntent?.requestedAmount)})</p>
              <div>
                <p className="font-semibold text-dark">Items</p>
                <ul className="mt-1 space-y-1">
                  {(selectedRequest.items || []).map((item) => (
                    <li key={`${item.orderItemId}-${item.name}`}>
                      {item.name} x {item.quantity} - {item.reason}
                      {item.exchangeSize ? ` (exchange size ${item.exchangeSize})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-dark">Status history</p>
                <ol className="mt-1 space-y-1">
                  {(selectedRequest.statusHistory || []).map((entry, index) => (
                    <li key={`${entry.status}-${entry.timestamp || index}`}>
                      {entry.status} by {entry.actorRole} on {formatDate(entry.timestamp)}
                      {entry.note ? ` - ${entry.note}` : ''}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <form onSubmit={handleActionSubmit} className="space-y-3 border border-gray-200 p-4">
              <label className="block text-sm font-semibold text-dark">
                Action
                <select
                  value={action.status}
                  onChange={(event) => setAction((current) => ({ ...current, status: event.target.value }))}
                  className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
                >
                  {adminActions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-dark">
                Note
                <textarea
                  value={action.note}
                  onChange={(event) => setAction((current) => ({ ...current, note: event.target.value }))}
                  className="mt-1 min-h-24 w-full border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-semibold text-dark">
                Manual refund amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={action.refundAmount}
                  onChange={(event) => setAction((current) => ({ ...current, refundAmount: event.target.value }))}
                  className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <button type="submit" disabled={saving} className="button-control button-control--primary button-control--full button-control--compact">
                {saving ? 'Saving...' : 'Update return'}
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
