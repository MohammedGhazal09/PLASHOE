import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';

const blankLookbookEntry = {
  title: '',
  status: 'active',
  image: '',
  description: '',
  sortOrder: '0',
  hotspots: '',
  bundleTitle: '',
  bundleDescription: '',
  bundleItems: '',
};

const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

const splitLines = (value = '') =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const compactObject = (value) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== '')
  );

const parseHotspotRows = (value) =>
  splitLines(value)
    .map((line) => {
      const [productId, x, y, label] = line.split('|').map((part) => part.trim());
      if (!productId || x === '' || y === '') return null;

      return compactObject({
        productId,
        x: Number(x),
        y: Number(y),
        label,
      });
    })
    .filter(Boolean);

const parseBundleRows = (value) =>
  splitLines(value)
    .map((line) => {
      const [productId, defaultSize, quantity] = line.split('|').map((part) => part.trim());
      if (!productId) return null;

      return compactObject({
        productId,
        defaultSize: defaultSize === '' ? undefined : Number(defaultSize),
        quantity: quantity === '' ? undefined : Number(quantity),
      });
    })
    .filter(Boolean);

const productLabel = (product = {}) => `${product.name || 'Product'} (${product._id})`;

const stringifyHotspots = (hotspots = []) =>
  hotspots
    .map((hotspot) =>
      [
        hotspot.product?._id,
        hotspot.x,
        hotspot.y,
        hotspot.label,
      ]
        .filter((value) => value !== undefined && value !== null && value !== '')
        .join(' | ')
    )
    .join('\n');

const stringifyBundleItems = (items = []) =>
  items
    .map((item) =>
      [
        item.product?._id,
        item.defaultSize,
        item.quantity,
      ]
        .filter((value) => value !== undefined && value !== null && value !== '')
        .join(' | ')
    )
    .join('\n');

const entryToForm = (entry) => ({
  title: entry.title || '',
  status: entry.status || 'active',
  image: entry.image || '',
  description: entry.description || '',
  sortOrder: String(entry.sortOrder ?? 0),
  hotspots: stringifyHotspots(entry.hotspots || []),
  bundleTitle: entry.bundle?.title || '',
  bundleDescription: entry.bundle?.description || '',
  bundleItems: stringifyBundleItems(entry.bundle?.items || []),
});

const toLookbookPayload = (form) => {
  const hotspots = parseHotspotRows(form.hotspots);
  const bundleItems = parseBundleRows(form.bundleItems);
  const bundle =
    form.bundleTitle && bundleItems.length > 0
      ? compactObject({
          title: form.bundleTitle,
          description: form.bundleDescription || undefined,
          items: bundleItems,
        })
      : undefined;

  return compactObject({
    title: form.title,
    status: form.status,
    image: form.image,
    description: form.description || undefined,
    sortOrder: form.sortOrder === '' ? undefined : Number(form.sortOrder),
    hotspots,
    bundle,
  });
};

export default function AdminLookbook() {
  const [entries, setEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(blankLookbookEntry);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [lookbookResponse, productsResponse] = await Promise.all([
        adminApi.getLookbookEntries(),
        adminApi.getProducts({ limit: 100, sort: 'newest' }),
      ]);
      setEntries(lookbookResponse.data || []);
      setProducts(productsResponse.data || []);
    } catch (err) {
      setError(getErrorMessage(err, 'We could not load lookbook data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const resetForm = () => {
    setForm(blankLookbookEntry);
    setEditingId('');
  };

  const editEntry = (entry) => {
    setEditingId(entry._id);
    setForm(entryToForm(entry));
  };

  const deleteEntry = async (entry) => {
    if (!window.confirm(`Delete: ${entry.title} cannot be undone. Continue?`)) return;
    setError('');
    setNotice('');
    try {
      await adminApi.deleteLookbookEntry(entry._id);
      setNotice('Lookbook entry deleted');
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Lookbook delete failed.'));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const payload = toLookbookPayload(form);
      if (editingId) {
        await adminApi.updateLookbookEntry(editingId, payload);
        setNotice('Lookbook entry updated');
      } else {
        await adminApi.createLookbookEntry(payload);
        setNotice('Lookbook entry created');
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Lookbook save failed.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <header className="border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase text-primary">Merchandising</p>
        <h2 className="mt-1 text-xl font-semibold text-dark">Lookbook</h2>
        <p className="mt-1 text-sm text-gray-600">{entries.length} loaded entries</p>
      </header>

      {error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="border border-green-200 bg-green-50 p-3 text-sm text-green-700">{notice}</p>}

      <section className="border border-gray-200 bg-white p-4">
        <h3 className="text-lg font-semibold text-dark">Product reference IDs</h3>
        {products.length === 0 ? (
          <p className="mt-2 text-sm text-gray-600">No products loaded yet.</p>
        ) : (
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {products.slice(0, 8).map((product) => (
              <p key={product._id} className="border border-gray-200 p-2 text-gray-700">
                {productLabel(product)}
              </p>
            ))}
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit} className="grid gap-3 border border-gray-200 bg-white p-4 md:grid-cols-2">
        <h3 className="md:col-span-2 text-lg font-semibold text-dark">
          {editingId ? 'Edit lookbook entry' : 'Save lookbook entry'}
        </h3>
        <label className="text-sm font-semibold text-dark">
          Title
          <input required value={form.title} onChange={(event) => setField('title', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-semibold text-dark">
          Image URL
          <input required value={form.image} onChange={(event) => setField('image', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-semibold text-dark">
          Status
          <select value={form.status} onChange={(event) => setField('status', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm">
            <option value="active">active</option>
            <option value="draft">draft</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-dark">
          Sort order
          <input type="number" min="0" value={form.sortOrder} onChange={(event) => setField('sortOrder', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="md:col-span-2 text-sm font-semibold text-dark">
          Description
          <textarea value={form.description} onChange={(event) => setField('description', event.target.value)} className="mt-1 min-h-24 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="md:col-span-2 text-sm font-semibold text-dark">
          Hotspots
          <textarea
            value={form.hotspots}
            onChange={(event) => setField('hotspots', event.target.value)}
            placeholder="Product ID | X percent | Y percent | Label"
            className="mt-1 min-h-24 w-full border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm font-semibold text-dark">
          Bundle title
          <input value={form.bundleTitle} onChange={(event) => setField('bundleTitle', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-semibold text-dark">
          Bundle description
          <input value={form.bundleDescription} onChange={(event) => setField('bundleDescription', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="md:col-span-2 text-sm font-semibold text-dark">
          Bundle items
          <textarea
            value={form.bundleItems}
            onChange={(event) => setField('bundleItems', event.target.value)}
            placeholder="Product ID | Default size | Quantity"
            className="mt-1 min-h-24 w-full border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <div className="flex gap-2 md:col-span-2 md:justify-end">
          {editingId && (
            <button type="button" onClick={resetForm} className="min-h-11 border border-gray-300 px-4 py-2 text-sm font-semibold text-dark">
              Cancel
            </button>
          )}
          <button type="submit" disabled={saving} className="min-h-11 bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? 'Saving...' : 'Save lookbook entry'}
          </button>
        </div>
      </form>

      {loading ? (
        <p role="status" className="border border-gray-200 bg-white p-4 text-sm text-gray-600">Loading lookbook...</p>
      ) : entries.length === 0 ? (
        <section className="border border-gray-200 bg-white p-8 text-center">
          <h3 className="text-lg font-semibold text-dark">No lookbook entries found</h3>
          <p className="mt-2 text-sm text-gray-600">Create an active scene to make the lookbook shoppable.</p>
        </section>
      ) : (
        <div className="overflow-x-auto border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-light text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Entry</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Bundle</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <tr key={entry._id}>
                  <td className="px-4 py-3 font-semibold text-dark">{entry.title}</td>
                  <td className="px-4 py-3 text-gray-700">{entry.status}</td>
                  <td className="px-4 py-3 text-gray-700">{entry.hotspots?.length || 0}</td>
                  <td className="px-4 py-3 text-gray-700">{entry.bundle?.items?.length || 0} item(s)</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => editEntry(entry)} className="min-h-11 border border-primary px-3 py-2 text-sm font-semibold text-primary">Edit</button>
                      <button type="button" onClick={() => deleteEntry(entry)} className="min-h-11 border border-red-300 px-3 py-2 text-sm font-semibold text-red-700">Delete</button>
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

