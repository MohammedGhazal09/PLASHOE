import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import AdminProductPicker from './AdminProductPicker';

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
      const lookbookResponse = await adminApi.getLookbookEntries();
      setEntries(lookbookResponse.data || []);
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

  const appendLine = (field, line) =>
    setForm((current) => ({
      ...current,
      [field]: [current[field], line].filter(Boolean).join('\n'),
    }));

  const addHotspotProduct = (product) => {
    appendLine('hotspots', `${product._id} | 50 | 50 | ${product.name}`);
  };

  const addBundleProduct = (product) => {
    appendLine('bundleItems', `${product._id} | ${product.sizes?.[0] || ''} | 1`);
    if (!form.bundleTitle) {
      setField('bundleTitle', 'Selected products');
    }
  };

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
        <div className="md:col-span-2">
          <AdminProductPicker
            label="Hotspot product"
            onSelect={addHotspotProduct}
          />
        </div>
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
        <div className="md:col-span-2">
          <AdminProductPicker
            label="Bundle product"
            onSelect={addBundleProduct}
          />
        </div>
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
            <button type="button" onClick={resetForm} className="button-control button-control--secondary button-control--compact">
              Cancel
            </button>
          )}
          <button type="submit" disabled={saving} className="button-control button-control--primary button-control--compact">
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
                      <button type="button" onClick={() => editEntry(entry)} className="button-control button-control--secondary button-control--compact">Edit</button>
                      <button type="button" onClick={() => deleteEntry(entry)} className="button-control button-control--danger button-control--compact">Delete</button>
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
