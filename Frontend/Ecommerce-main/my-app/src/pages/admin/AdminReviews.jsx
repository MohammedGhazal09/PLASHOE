import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';

const approvalStatuses = [
  { label: 'All states', value: '' },
  { label: 'Approved', value: 'true' },
  { label: 'Hidden', value: 'false' },
];

const fitLabels = {
  runs_small: 'Runs small',
  true_to_size: 'True to size',
  runs_large: 'Runs large',
};

const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

const formatDate = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not set' : date.toLocaleDateString();
};

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1, limit: 20 });
  const [filters, setFilters] = useState({ isApproved: '', productId: '', q: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [savingId, setSavingId] = useState('');

  const loadReviews = async (page = meta.page || 1) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: meta.limit || 20,
        isApproved: filters.isApproved || undefined,
        productId: filters.productId || undefined,
        q: filters.q || undefined,
      };
      const response = await adminApi.getAdminReviews(params);
      setReviews(response.data || []);
      setMeta({
        total: response.total || 0,
        page: response.page || page,
        pages: response.pages || 1,
        limit: response.limit || params.limit,
      });
    } catch (err) {
      setError(getErrorMessage(err, 'We could not load reviews.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews(1);
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
    void loadReviews(1);
  };

  const openReview = async (id) => {
    setSelectedReview(null);
    setDetailLoading(true);
    setDetailError('');
    setNotice('');
    try {
      const response = await adminApi.getAdminReview(id);
      setSelectedReview(response.data);
    } catch (err) {
      setDetailError(getErrorMessage(err, 'We could not load this review.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const updateModeration = async (review, isApproved) => {
    setSavingId(`${review._id}-${isApproved}`);
    setError('');
    setDetailError('');
    setNotice('');
    try {
      const response = await adminApi.updateReviewModeration(review._id, { isApproved });
      setNotice(response.message || 'Review moderation updated');
      setSelectedReview(response.data);
      await loadReviews(meta.page);
    } catch (err) {
      setDetailError(getErrorMessage(err, 'Review moderation update failed.'));
    } finally {
      setSavingId('');
    }
  };

  const renderActions = (review) => (
    <div className="flex flex-wrap gap-2">
      {!review.isApproved && (
        <button
          type="button"
          onClick={() => updateModeration(review, true)}
          disabled={Boolean(savingId)}
          className="button-control button-control--secondary button-control--compact"
        >
          {savingId === `${review._id}-true` ? 'Saving...' : 'Approve'}
        </button>
      )}
      {review.isApproved && (
        <button
          type="button"
          onClick={() => updateModeration(review, false)}
          disabled={Boolean(savingId)}
          className="button-control button-control--danger button-control--compact"
        >
          {savingId === `${review._id}-false` ? 'Saving...' : 'Hide'}
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <header className="border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase text-primary">Customer trust</p>
        <h2 className="mt-1 text-xl font-semibold text-dark">Reviews</h2>
        <p className="mt-1 text-sm text-gray-600">{meta.total} reviews match the current filters</p>
      </header>

      {error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="border border-green-200 bg-green-50 p-3 text-sm text-green-700">{notice}</p>}

      <form onSubmit={handleFilterSubmit} className="grid gap-3 border border-gray-200 bg-white p-4 md:grid-cols-4">
        <label className="text-sm font-semibold text-dark">
          Approval
          <select
            value={filters.isApproved}
            onChange={(event) => setFilter('isApproved', event.target.value)}
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
          >
            {approvalStatuses.map((status) => (
              <option key={status.value || 'all'} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
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
          Search
          <input
            type="search"
            value={filters.q}
            onChange={(event) => setFilter('q', event.target.value)}
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
            placeholder="title or comment"
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
          Loading reviews...
        </p>
      ) : reviews.length === 0 ? (
        <section className="border border-gray-200 bg-white p-8 text-center">
          <h3 className="text-lg font-semibold text-dark">No reviews match these filters</h3>
          <p className="mt-2 text-sm text-gray-600">Adjust filters to inspect customer review content.</p>
        </section>
      ) : (
        <div className="overflow-x-auto border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-light text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Review</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reviews.map((review) => (
                <tr key={review._id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-dark">{review.title}</p>
                    <p className="mt-1 max-w-md text-gray-700">{review.comment}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{review.product?.name || 'Deleted product'}</td>
                  <td className="px-4 py-3 text-gray-700">{review.user?.email || review.user?.name || 'Unknown'}</td>
                  <td className="px-4 py-3 text-gray-700">{review.rating}</td>
                  <td className="px-4 py-3 text-gray-700">{review.isApproved ? 'Approved' : 'Hidden'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openReview(review._id)}
                        className="button-control button-control--secondary button-control--compact"
                      >
                        Inspect
                      </button>
                      {renderActions(review)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="border border-gray-200 bg-white p-4">
        <h3 className="text-lg font-semibold text-dark">Review detail</h3>
        {detailLoading && <p role="status" className="mt-3 text-sm text-gray-600">Loading review detail...</p>}
        {detailError && <p role="alert" className="mt-3 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{detailError}</p>}
        {!detailLoading && !selectedReview && !detailError && (
          <p className="mt-3 text-sm text-gray-600">Select a review to inspect moderation context.</p>
        )}
        {selectedReview && (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_240px]">
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-semibold text-dark">Product:</span> {selectedReview.product?.name || 'Deleted product'}</p>
              <p><span className="font-semibold text-dark">Customer:</span> {selectedReview.user?.email || selectedReview.user?.name || 'Unknown'}</p>
              <p><span className="font-semibold text-dark">Submitted:</span> {formatDate(selectedReview.createdAt)}</p>
              <p><span className="font-semibold text-dark">Rating:</span> {selectedReview.rating}</p>
              <p><span className="font-semibold text-dark">Fit:</span> {fitLabels[selectedReview.fit] || 'Not set'}</p>
              <p><span className="font-semibold text-dark">State:</span> {selectedReview.isApproved ? 'Approved' : 'Hidden'}</p>
              <div>
                <p className="font-semibold text-dark">{selectedReview.title}</p>
                <p className="mt-1 leading-6">{selectedReview.comment}</p>
              </div>
            </div>
            <div className="space-y-2">
              {renderActions(selectedReview)}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
