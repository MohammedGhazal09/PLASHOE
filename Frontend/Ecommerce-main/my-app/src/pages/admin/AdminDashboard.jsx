import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowsRotate,
  faBoxOpen,
  faChartLine,
  faEnvelope,
  faTags,
  faTruckFast,
} from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../../api/adminApi';

const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

const formatNumber = (value) =>
  new Intl.NumberFormat('en-US').format(Number(value || 0));

const labelize = (value) =>
  String(value || 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const sumValues = (values = {}) =>
  Object.values(values).reduce((total, value) => total + Number(value || 0), 0);

function MetricTile({ icon, label, value, detail }) {
  return (
    <div className="min-w-0 border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
          <p className="mt-2 break-words text-2xl font-semibold text-dark">{value}</p>
        </div>
        <FontAwesomeIcon icon={icon} className="mt-1 h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
      </div>
      {detail && <p className="mt-2 text-sm text-gray-600">{detail}</p>}
    </div>
  );
}

function CountList({ title, values }) {
  const entries = Object.entries(values || {});

  return (
    <section className="border border-gray-200 bg-white p-4">
      <h3 className="text-lg font-semibold text-dark">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-gray-600">No activity yet.</p>
      ) : (
        <dl className="mt-3 space-y-2">
          {entries.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 text-sm">
              <dt className="min-w-0 break-words text-gray-600">{labelize(label)}</dt>
              <dd className="font-semibold text-dark">{formatNumber(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.getSummary();
      setSummary(response.data || null);
    } catch (err) {
      setError(getErrorMessage(err, 'We could not load the store dashboard. Check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  const isEmpty = useMemo(() => {
    if (!summary) return false;

    return (
      Number(summary.orders?.total || 0) === 0 &&
      Number(summary.inventory?.productCount || 0) === 0 &&
      Number(summary.returns?.openCount || 0) === 0 &&
      Number(summary.messages?.unreadCount || 0) === 0 &&
      Number(summary.coupons?.activeCount || 0) === 0
    );
  }, [summary]);

  if (loading) {
    return (
      <p role="status" className="border border-gray-200 bg-white p-4 text-sm text-gray-600">
        Loading store dashboard...
      </p>
    );
  }

  if (error) {
    return (
      <section className="border border-red-200 bg-red-50 p-4">
        <h2 className="text-lg font-semibold text-red-800">Dashboard unavailable</h2>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={loadSummary}
          className="button-control button-control--secondary button-control--compact mt-4"
        >
          <FontAwesomeIcon icon={faArrowsRotate} aria-hidden="true" />
          Retry
        </button>
      </section>
    );
  }

  const generatedAt = summary?.generatedAt ? new Date(summary.generatedAt) : null;
  const generatedLabel =
    generatedAt && !Number.isNaN(generatedAt.getTime())
      ? generatedAt.toLocaleString()
      : 'Not available';
  const lowStockProducts = summary?.inventory?.lowStockProducts || [];
  const statusTotal = sumValues(summary?.orders?.byStatus);
  const paymentTotal = sumValues(summary?.orders?.paymentsByStatus);

  return (
    <div className="space-y-4">
      <header className="border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Operations</p>
            <h2 className="mt-1 text-xl font-semibold text-dark">Dashboard</h2>
            <p className="mt-1 text-sm text-gray-600">Snapshot generated {generatedLabel}</p>
          </div>
          <button
            type="button"
            onClick={loadSummary}
            className="button-control button-control--secondary button-control--compact"
          >
            <FontAwesomeIcon icon={faArrowsRotate} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </header>

      {isEmpty && (
        <section className="border border-gray-200 bg-white p-6 text-center">
          <h3 className="text-lg font-semibold text-dark">No store activity yet</h3>
          <p className="mt-2 text-sm text-gray-600">
            Revenue, orders, returns, messages, and coupon usage will appear here as the store receives activity.
          </p>
        </section>
      )}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Store summary metrics">
        <MetricTile
          icon={faChartLine}
          label="Paid revenue"
          value={formatCurrency(summary?.revenue?.paidTotal)}
          detail={`${formatNumber(summary?.revenue?.paidOrderCount)} paid orders`}
        />
        <MetricTile
          icon={faTruckFast}
          label="Orders"
          value={formatNumber(summary?.orders?.total)}
          detail={`${formatNumber(statusTotal)} status-tracked orders`}
        />
        <MetricTile
          icon={faArrowsRotate}
          label="Open returns"
          value={formatNumber(summary?.returns?.openCount)}
          detail="Requested, approved, or received"
        />
        <MetricTile
          icon={faEnvelope}
          label="Unread messages"
          value={formatNumber(summary?.messages?.unreadCount)}
          detail="Customer contact workload"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <CountList title="Fulfillment status" values={summary?.orders?.byStatus} />
        <CountList title="Payment status" values={summary?.orders?.paymentsByStatus} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <section className="border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-dark">Inventory health</h3>
              <p className="mt-1 text-sm text-gray-600">
                Low stock threshold: {formatNumber(summary?.inventory?.lowStockThreshold)} units
              </p>
            </div>
            <FontAwesomeIcon icon={faBoxOpen} className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase text-gray-500">Products</dt>
              <dd className="mt-1 text-xl font-semibold text-dark">{formatNumber(summary?.inventory?.productCount)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-gray-500">Low stock</dt>
              <dd className="mt-1 text-xl font-semibold text-dark">{formatNumber(summary?.inventory?.lowStockCount)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-gray-500">Out of stock</dt>
              <dd className="mt-1 text-xl font-semibold text-dark">{formatNumber(summary?.inventory?.outOfStockCount)}</dd>
            </div>
          </dl>
          {lowStockProducts.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">No low-stock products need attention.</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100 border border-gray-100">
              {lowStockProducts.map((product) => (
                <li key={product._id || product.name} className="flex items-center justify-between gap-4 p-3 text-sm">
                  <span className="min-w-0 break-words font-semibold text-dark">{product.name}</span>
                  <span className="flex-shrink-0 text-gray-600">{formatNumber(product.stock)} left</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-dark">Coupons</h3>
              <p className="mt-1 text-sm text-gray-600">Active promotions and redemption count.</p>
            </div>
            <FontAwesomeIcon icon={faTags} className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-gray-500">Active coupons</dt>
              <dd className="mt-1 text-xl font-semibold text-dark">{formatNumber(summary?.coupons?.activeCount)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-gray-500">Redemptions</dt>
              <dd className="mt-1 text-xl font-semibold text-dark">{formatNumber(summary?.coupons?.totalRedemptions)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-gray-600">
            Payment statuses tracked: {formatNumber(paymentTotal)}
          </p>
        </section>
      </div>
    </div>
  );
}
