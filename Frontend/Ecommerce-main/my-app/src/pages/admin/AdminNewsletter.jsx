import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/adminApi';

const subscriptionStatuses = ['', 'active', 'unsubscribed', 'suppressed'];

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

export default function AdminNewsletter() {
  const [summary, setSummary] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1, limit: 20 });
  const [filters, setFilters] = useState({ status: 'active', email: '', source: '', q: '' });
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState('');

  const topSource = useMemo(() => summary?.sourceCounts?.[0], [summary]);

  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      const response = await adminApi.getNewsletterSummary();
      setSummary(response.data || null);
    } catch (err) {
      setError(getErrorMessage(err, 'We could not load newsletter summary.'));
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadSubscriptions = async (page = meta.page || 1) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: meta.limit || 20,
        status: filters.status || undefined,
        email: filters.email || undefined,
        source: filters.source || undefined,
        q: filters.q || undefined,
      };
      const response = await adminApi.getNewsletterSubscriptions(params);
      setSubscriptions(response.data || []);
      setMeta({
        total: response.total || 0,
        page: response.page || page,
        pages: response.pages || 1,
        limit: response.limit || params.limit,
      });
    } catch (err) {
      setError(getErrorMessage(err, 'We could not load newsletter subscriptions.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSummary();
    void loadSubscriptions(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFilter = (field, value) =>
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    void loadSubscriptions(1);
  };

  return (
    <div className="space-y-4">
      <header className="border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase text-primary">Lifecycle</p>
        <h2 className="mt-1 text-xl font-semibold text-dark">Newsletter</h2>
        <p className="mt-1 text-sm text-gray-600">{formatNumber(meta.total)} subscriptions match the current filters</p>
      </header>

      {error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <section className="grid gap-3 md:grid-cols-3" aria-label="Newsletter summary">
        <MetricTile
          label="Active subscribers"
          value={summaryLoading ? '...' : formatNumber(summary?.activeCount)}
          detail={`${formatNumber(summary?.totalCount)} total subscription records`}
        />
        <MetricTile
          label="Top source"
          value={summaryLoading || !topSource ? 'Not set' : labelize(topSource.source)}
          detail={topSource ? `${formatNumber(topSource.count)} records` : 'No subscription source data'}
        />
        <MetricTile
          label="Status mix"
          value={summaryLoading ? '...' : formatNumber(Object.keys(summary?.statusCounts || {}).length)}
          detail={Object.entries(summary?.statusCounts || {})
            .map(([status, count]) => `${labelize(status)} ${formatNumber(count)}`)
            .join(' / ') || 'No subscriptions yet'}
        />
      </section>

      <form onSubmit={handleFilterSubmit} className="grid gap-3 border border-gray-200 bg-white p-4 md:grid-cols-3 xl:grid-cols-5">
        <label className="text-sm font-semibold text-dark">
          Status
          <select
            value={filters.status}
            onChange={(event) => setFilter('status', event.target.value)}
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
          >
            {subscriptionStatuses.map((status) => (
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
            placeholder="subscriber@example.com"
          />
        </label>
        <label className="text-sm font-semibold text-dark">
          Source
          <input
            value={filters.source}
            onChange={(event) => setFilter('source', event.target.value)}
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
            placeholder="home_newsletter"
          />
        </label>
        <label className="text-sm font-semibold text-dark">
          Search
          <input
            type="search"
            value={filters.q}
            onChange={(event) => setFilter('q', event.target.value)}
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
            placeholder="email or source"
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
          Loading newsletter subscriptions...
        </p>
      ) : subscriptions.length === 0 ? (
        <section className="border border-gray-200 bg-white p-8 text-center">
          <h3 className="text-lg font-semibold text-dark">No newsletter subscriptions match these filters</h3>
          <p className="mt-2 text-sm text-gray-600">Adjust filters to review subscription records.</p>
        </section>
      ) : (
        <div className="overflow-x-auto border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-light text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Subscribed</th>
                <th className="px-4 py-3">Unsubscribed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscriptions.map((subscription) => (
                <tr key={subscription._id}>
                  <td className="px-4 py-3 font-semibold text-dark">{subscription.email}</td>
                  <td className="px-4 py-3 text-gray-700">{labelize(subscription.status)}</td>
                  <td className="px-4 py-3 text-gray-700">{labelize(subscription.source)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(subscription.subscribedAt || subscription.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(subscription.unsubscribedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
