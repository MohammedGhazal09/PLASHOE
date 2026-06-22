import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';

const blankCoupon = {
  code: '',
  discountPercentage: '',
  minOrderAmount: '',
  maxUses: '',
  validFrom: '',
  validUntil: '',
  isActive: true,
};

const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

const formatDate = (value) => {
  if (!value) return 'Open';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Open' : date.toLocaleDateString();
};

const formatUsage = (coupon) => {
  const used = coupon.usedCount ?? 0;
  return coupon.maxUses ? `${used} / ${coupon.maxUses}` : `${used} / unlimited`;
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(blankCoupon);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadCoupons = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.getCoupons({ limit: 50 });
      setCoupons(response.data || []);
    } catch (err) {
      setError(getErrorMessage(err, 'We could not load this admin data. Check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCoupons();
  }, []);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      await adminApi.createCoupon({
        code: form.code,
        discountPercentage: Number(form.discountPercentage),
        minOrderAmount: form.minOrderAmount === '' ? undefined : Number(form.minOrderAmount),
        maxUses: form.maxUses === '' ? undefined : Number(form.maxUses),
        validFrom: form.validFrom || undefined,
        validUntil: form.validUntil || undefined,
        isActive: form.isActive,
      });
      setForm(blankCoupon);
      setNotice('Coupon created');
      await loadCoupons();
    } catch (err) {
      setError(getErrorMessage(err, 'Coupon create failed.'));
    }
  };

  const deleteCoupon = async (coupon) => {
    if (!window.confirm(`Delete: ${coupon.code} cannot be undone. Continue?`)) return;
    setError('');
    setNotice('');
    try {
      await adminApi.deleteCoupon(coupon._id);
      setNotice('Coupon deleted');
      await loadCoupons();
    } catch (err) {
      setError(getErrorMessage(err, 'Coupon delete failed.'));
    }
  };

  return (
    <div className="space-y-4">
      <header className="border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase text-primary">Promotions</p>
        <h2 className="mt-1 text-xl font-semibold text-dark">Coupons</h2>
      </header>

      {error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="border border-green-200 bg-green-50 p-3 text-sm text-green-700">{notice}</p>}

      <form onSubmit={handleSubmit} className="grid gap-3 border border-gray-200 bg-white p-4 md:grid-cols-3">
        <label className="text-sm font-semibold text-dark">
          Code
          <input required value={form.code} onChange={(event) => setField('code', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm uppercase" />
        </label>
        <label className="text-sm font-semibold text-dark">
          Discount %
          <input required type="number" min="0" max="100" value={form.discountPercentage} onChange={(event) => setField('discountPercentage', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-semibold text-dark">
          Min order
          <input type="number" min="0" value={form.minOrderAmount} onChange={(event) => setField('minOrderAmount', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-semibold text-dark">
          Max uses
          <input type="number" min="1" value={form.maxUses} onChange={(event) => setField('maxUses', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-semibold text-dark">
          Valid from
          <input type="date" value={form.validFrom} onChange={(event) => setField('validFrom', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-semibold text-dark">
          Valid until
          <input type="date" value={form.validUntil} onChange={(event) => setField('validUntil', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="flex items-center gap-2 pt-6 text-sm font-semibold text-dark">
          <input type="checkbox" checked={form.isActive} onChange={(event) => setField('isActive', event.target.checked)} />
          Active
        </label>
        <div className="flex items-end">
          <button type="submit" className="button-control button-control--primary button-control--full button-control--compact">
            Create coupon
          </button>
        </div>
      </form>

      {loading ? (
        <p role="status" className="border border-gray-200 bg-white p-4 text-sm text-gray-600">Loading coupons...</p>
      ) : coupons.length === 0 ? (
        <section className="border border-gray-200 bg-white p-8 text-center">
          <h3 className="text-lg font-semibold text-dark">No coupons found</h3>
          <p className="mt-2 text-sm text-gray-600">Create a coupon when a promotion is ready.</p>
        </section>
      ) : (
        <div className="overflow-x-auto border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-light text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Minimum</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Validity</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((coupon) => (
                <tr key={coupon._id}>
                  <td className="px-4 py-3 font-semibold text-dark">{coupon.code}</td>
                  <td className="px-4 py-3 text-gray-700">{coupon.discountPercentage}%</td>
                  <td className="px-4 py-3 text-gray-700">{coupon.minOrderAmount ?? 0}</td>
                  <td className="px-4 py-3 text-gray-700">{formatUsage(coupon)}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{coupon.isActive ? 'active' : 'inactive'}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => deleteCoupon(coupon)} className="button-control button-control--danger button-control--compact">
                      Delete
                    </button>
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
