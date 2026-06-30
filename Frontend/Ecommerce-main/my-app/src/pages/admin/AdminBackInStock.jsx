import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/adminApi';

const requestStatuses = ['', 'pending', 'notified', 'cancelled'];

const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not set' : date.toLocaleDateString();
};

const labelize = (value) =>
  String(value || 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function MetricTile({ label, value, detail }) {
  return (
    <div className="border border-gray-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-dark">{value}</p>
      {detail && <p className="mt-2 text-sm text-gray-600">{detail}</p>}
    </div>
  );
}

export default function AdminBackInStock() {
  const [summary, setSummary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1, limit: 20 });
  const [filters, setFilters] = useState({
    status: 'pending',
    email: '',
    productId: '',
    size: '',
    q: '',
  });
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [savingId, setSavingId] = useState('');

  const topSize = useMemo(() => summary?.pendingBySize?.[0], [summary]);
  const topDemand = summary?.topDemand || [];

  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      const response = await adminApi.getBackInStockSummary();
      setSummary(response.data || null);
    } catch (err) {
      setError(getErrorMessage(err, 'We could not load back-in-stock demand.'));
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadRequests = async (page = meta.page || 1) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: meta.limit || 20,
        status: filters.status || undefined,
        email: filters.email || undefined,
        productId: filters.productId || undefined,
        size: filters.size || undefined,
        q: filters.q || undefined,
      };
      const response = await adminApi.getBackInStockRequests(params);
      setRequests(response.data || []);
      setMeta({
        total: response.total || 0,
        page: response.page || page,
        pages: response.pages || 1,
        limit: response.limit || params.limit,
      });
    } catch (err) {
      setError(getErrorMessage(err, 'We could not load back-in-stock requests.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSummary();
    void loadRequests(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFilter = (field, value) =>
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setNotice('');
    void loadRequests(1);
  };

  const updateStatus = async (request, status) => {
    setSavingId(`${request._id}-${status}`);
    setError('');
    setNotice('');
    try {
      const response = await adminApi.updateBackInStockStatus(request._id, { status });
      setNotice(response.message || 'Back-in-stock request updated');
      await Promise.all([loadSummary(), loadRequests(meta.page)]);
    } catch (err) {
      setError(getErrorMessage(err, 'Back-in-stock request update failed.'));
    } finally {
      setSavingId('');
    }
  };

  return (
    <div className="space-y-4">
      <header className="border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase text-primary">Retention</p>
        <h2 className="mt-1 text-xl font-semibold text-dark">Back-in-stock</h2>
        <p className="mt-1 text-sm text-gray-600">{formatNumber(meta.total)} requests match the current filters</p>
      </header>

      {error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="border border-green-200 bg-green-50 p-3 text-sm text-green-700">{notice}</p>}

      <section className="grid gap-3 md:grid-cols-3" aria-label="Back-in-stock summary">
        <MetricTile
          label="Pending demand"
          value={summaryLoading ? '...' : formatNumber(summary?.pendingCount)}
          detail={`${formatNumber(summary?.totalCount)} total captured`}
        />
        <MetricTile
          label="Top size"
          value={summaryLoading || !topSize ? 'Not set' : topSize.size}
          detail={topSize ? `${formatNumber(topSize.count)} pending requests` : 'No pending size demand'}
        />
        <MetricTile
          label="Status mix"
          value={summaryLoading ? '...' : formatNumber(Object.keys(summary?.statusCounts || {}).length)}
          detail={Object.entries(summary?.statusCounts || {})
            .map(([status, count]) => `${labelize(status)} ${formatNumber(count)}`)
            .join(' / ') || 'No requests yet'}
        />
      </section>

      <section className="border border-gray-200 bg-white p-4">
        <h3 className="text-lg font-semibold text-dark">Largest pending demand</h3>
        {topDemand.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">No pending restock demand found.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 border border-gray-100">
            {topDemand.map((item) => (
              <li key={`${item.product?._id}-${item.size}`} className="grid gap-2 p-3 text-sm md:grid-cols-[1fr_auto_auto] md:items-center">
                <span className="min-w-0 break-words font-semibold text-dark">
                  {item.product?.name || 'Deleted product'} / Size {item.size}
                </span>
                <span className="text-gray-700">{formatNumber(item.pendingCount)} pending</span>
                <span className="text-gray-600">{formatNumber(item.emailCount)} customers</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={handleFilterSubmit} className="grid gap-3 border border-gray-200 bg-white p-4 md:grid-cols-3 xl:grid-cols-6">
        <label className="text-sm font-semibold text-dark">
          Status
          <select
            value={filters.status}
            onChange={(event) => setFilter('status', event.target.value)}
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
          Email
          <input
            type="search"
            value={filters.email}
            onChange={(event) => setFilter('email', event.target.value)}
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
            placeholder="customer@example.com"
          />
        </label>
        <label className="text-sm font-semibold text-dark">
          Product ID
          <input
            value={filters.productId}
            onChange={(event) => setFilter('productId', event.target.value)}
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
            placeholder="24-character id"
          />
        </label>
        <label className="text-sm font-semibold text-dark">
          Size
          <input
            type="number"
            min="35"
            max="45"
            value={filters.size}
            onChange={(event) => setFilter('size', event.target.value)}
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm font-semibold text-dark">
          Search
          <input
            type="search"
            value={filters.q}
            onChange={(event) => setFilter('q', event.target.value)}
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
            placeholder="email or product"
          />
        </label>
        <div className="flex items-end">
          <button type="submit" className="button-control button-control--primary button-control--full button-control--compact">
            Apply filters
          </button>
        </div>
      </form>

      {loading ? (
        <p role="status" className="border border-gray-200 bg-white p-4 text-sm text-gray-600">
          Loading back-in-stock requests...
        </p>
      ) : requests.length === 0 ? (
        <section className="border border-gray-200 bg-white p-8 text-center">
          <h3 className="text-lg font-semibold text-dark">No back-in-stock requests match these filters</h3>
          <p className="mt-2 text-sm text-gray-600">Adjust filters to review recent demand.</p>
        </section>
      ) : (
        <div className="overflow-x-auto border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-light text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((request) => (
                <tr key={request._id}>
                  <td className="px-4 py-3 font-semibold text-dark">{request.product?.name || 'Deleted product'}</td>
                  <td className="px-4 py-3 text-gray-700">{request.size}</td>
                  <td className="px-4 py-3 text-gray-700">{request.email}</td>
                  <td className="px-4 py-3 text-gray-700">{labelize(request.status)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(request.requestedAt || request.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatNumber(request.product?.stock)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {request.status !== 'notified' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(request, 'notified')}
                          disabled={Boolean(savingId)}
                          className="button-control button-control--secondary button-control--compact"
                        >
                          {savingId === `${request._id}-notified` ? 'Saving...' : 'Mark notified'}
                        </button>
                      )}
                      {request.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(request, 'cancelled')}
                          disabled={Boolean(savingId)}
                          className="button-control button-control--danger button-control--compact"
                        >
                          {savingId === `${request._id}-cancelled` ? 'Saving...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
