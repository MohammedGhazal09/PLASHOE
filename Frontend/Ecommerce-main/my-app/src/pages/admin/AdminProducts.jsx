import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';

const blankProduct = {
  name: '',
  gender: 'male',
  category: 'Running',
  image: '',
  originalPrice: '',
  currentPrice: '',
  rating: '',
  sizes: '35,36,37,38,39,40,41,42,43,44,45',
  stock: '',
  isOnSale: false,
  description: '',
  materials: '',
  careInstructions: '',
  sustainabilitySummary: '',
  sustainabilitySource: '',
  impactMetrics: '',
  certifications: '',
  manufacturingLocation: '',
  manufacturingFacility: '',
  manufacturingProcess: '',
  manufacturingSource: '',
  durabilitySummary: '',
  durabilityRepairability: '',
  durabilityExpectedUse: '',
  durabilitySource: '',
};

const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

const splitLines = (value = '') =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const compactObject = (value) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => {
      if (Array.isArray(entry)) return entry.length > 0;
      if (entry && typeof entry === 'object') return Object.keys(entry).length > 0;

      return entry !== undefined && entry !== null && entry !== '';
    })
  );

const parseMaterialRows = (value) =>
  splitLines(value).map((line) => {
    const separator = line.indexOf(':');

    if (separator === -1) {
      return { label: 'Material', value: line };
    }

    return {
      label: line.slice(0, separator).trim(),
      value: line.slice(separator + 1).trim(),
    };
  });

const parseColumnRows = (value, mapper) =>
  splitLines(value)
    .map((line) => mapper(line.split('|').map((part) => part.trim())))
    .filter((item) => Object.keys(item).length > 0);

const parseImpactMetricRows = (value) =>
  parseColumnRows(value, ([label, metricValue, unit, source]) =>
    compactObject({
      label,
      value: metricValue,
      unit,
      source,
    })
  );

const parseCertificationRows = (value) =>
  parseColumnRows(value, ([name, issuer, url]) =>
    compactObject({
      name,
      issuer,
      url,
    })
  );

const stringifyMaterials = (materials = []) =>
  materials.map((item) => `${item.label}: ${item.value}`).join('\n');

const stringifyImpactMetrics = (metrics = []) =>
  metrics.map((item) => [item.label, item.value, item.unit, item.source].filter(Boolean).join(' | ')).join('\n');

const stringifyCertifications = (certifications = []) =>
  certifications.map((item) => [item.name, item.issuer, item.url].filter(Boolean).join(' | ')).join('\n');

const buildSustainabilityPayload = (form) => {
  const sustainability = compactObject({
    summary: form.sustainabilitySummary || undefined,
    source: form.sustainabilitySource || undefined,
    impactMetrics: parseImpactMetricRows(form.impactMetrics),
    certifications: parseCertificationRows(form.certifications),
    manufacturing: compactObject({
      location: form.manufacturingLocation || undefined,
      facility: form.manufacturingFacility || undefined,
      process: form.manufacturingProcess || undefined,
      source: form.manufacturingSource || undefined,
    }),
    durability: compactObject({
      summary: form.durabilitySummary || undefined,
      repairability: form.durabilityRepairability || undefined,
      expectedUse: form.durabilityExpectedUse || undefined,
      source: form.durabilitySource || undefined,
    }),
  });

  return Object.keys(sustainability).length > 0 ? sustainability : undefined;
};

const toProductPayload = (form) => ({
  name: form.name,
  gender: form.gender,
  category: form.category,
  image: form.image,
  price: {
    original: Number(form.originalPrice),
    current: Number(form.currentPrice),
  },
  rating: form.rating === '' ? undefined : Number(form.rating),
  sizes: form.sizes
    .split(',')
    .map((size) => Number(size.trim()))
    .filter(Boolean),
  stock: form.stock === '' ? undefined : Number(form.stock),
  isOnSale: Boolean(form.isOnSale),
  description: form.description || undefined,
  materials: parseMaterialRows(form.materials),
  careInstructions: splitLines(form.careInstructions),
  sustainability: buildSustainabilityPayload(form),
});

const productToForm = (product) => ({
  name: product.name || '',
  gender: product.gender || 'male',
  category: product.category || 'Running',
  image: product.image || '',
  originalPrice: product.price?.original ?? '',
  currentPrice: product.price?.current ?? '',
  rating: product.rating ?? '',
  sizes: (product.sizes || []).join(',') || blankProduct.sizes,
  stock: product.stock ?? '',
  isOnSale: Boolean(product.isOnSale),
  description: product.description || '',
  materials: stringifyMaterials(product.materials || []),
  careInstructions: (product.careInstructions || []).join('\n'),
  sustainabilitySummary: product.sustainability?.summary || '',
  sustainabilitySource: product.sustainability?.source || '',
  impactMetrics: stringifyImpactMetrics(product.sustainability?.impactMetrics || []),
  certifications: stringifyCertifications(product.sustainability?.certifications || []),
  manufacturingLocation: product.sustainability?.manufacturing?.location || '',
  manufacturingFacility: product.sustainability?.manufacturing?.facility || '',
  manufacturingProcess: product.sustainability?.manufacturing?.process || '',
  manufacturingSource: product.sustainability?.manufacturing?.source || '',
  durabilitySummary: product.sustainability?.durability?.summary || '',
  durabilityRepairability: product.sustainability?.durability?.repairability || '',
  durabilityExpectedUse: product.sustainability?.durability?.expectedUse || '',
  durabilitySource: product.sustainability?.durability?.source || '',
});

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(blankProduct);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.getProducts({ limit: 50, sort: 'newest' });
      setProducts(response.data || []);
    } catch (err) {
      setError(getErrorMessage(err, 'We could not load this admin data. Check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const resetForm = () => {
    setForm(blankProduct);
    setEditingId('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = toProductPayload(form);
      if (editingId) {
        await adminApi.updateProduct(editingId, payload);
        setNotice('Product updated');
      } else {
        await adminApi.createProduct(payload);
        setNotice('Product created');
      }
      resetForm();
      await loadProducts();
    } catch (err) {
      setError(getErrorMessage(err, 'Product save failed.'));
    } finally {
      setSaving(false);
    }
  };

  const editProduct = (product) => {
    setEditingId(product._id);
    setForm(productToForm(product));
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete: ${product.name} cannot be undone. Continue?`)) return;
    setError('');
    setNotice('');
    try {
      await adminApi.deleteProduct(product._id);
      setNotice('Product deleted');
      await loadProducts();
    } catch (err) {
      setError(getErrorMessage(err, 'Product delete failed.'));
    }
  };

  return (
    <div className="space-y-4">
      <header className="border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase text-primary">Catalog</p>
        <h2 className="mt-1 text-xl font-semibold text-dark">Products</h2>
        <p className="mt-1 text-sm text-gray-600">{products.length} loaded products</p>
      </header>

      {error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="border border-green-200 bg-green-50 p-3 text-sm text-green-700">{notice}</p>}

      <form onSubmit={handleSubmit} className="grid gap-3 border border-gray-200 bg-white p-4 md:grid-cols-2">
        <h3 className="md:col-span-2 text-lg font-semibold text-dark">{editingId ? 'Edit product' : 'Save product'}</h3>
        <label className="text-sm font-semibold text-dark">
          Name
          <input required value={form.name} onChange={(event) => setField('name', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-semibold text-dark">
          Image URL
          <input required value={form.image} onChange={(event) => setField('image', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-semibold text-dark">
          Gender
          <select value={form.gender} onChange={(event) => setField('gender', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm">
            <option value="male">male</option>
            <option value="female">female</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-dark">
          Category
          <select value={form.category} onChange={(event) => setField('category', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm">
            <option value="Training">Training</option>
            <option value="Running">Running</option>
            <option value="Sneaker">Sneaker</option>
            <option value="Classic">Classic</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-dark">
          Original price
          <input required type="number" min="0" value={form.originalPrice} onChange={(event) => setField('originalPrice', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-semibold text-dark">
          Current price
          <input required type="number" min="0" value={form.currentPrice} onChange={(event) => setField('currentPrice', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-semibold text-dark">
          Sizes
          <input value={form.sizes} onChange={(event) => setField('sizes', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-semibold text-dark">
          Stock
          <input type="number" min="0" value={form.stock} onChange={(event) => setField('stock', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="md:col-span-2 text-sm font-semibold text-dark">
          Description
          <textarea value={form.description} onChange={(event) => setField('description', event.target.value)} className="mt-1 min-h-24 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <h4 className="md:col-span-2 text-sm font-semibold uppercase tracking-wide text-gray-600">Materials and care</h4>
        <label className="text-sm font-semibold text-dark">
          Materials
          <textarea
            value={form.materials}
            onChange={(event) => setField('materials', event.target.value)}
            placeholder="Upper: Recycled knit textile"
            className="mt-1 min-h-24 w-full border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm font-semibold text-dark">
          Care instructions
          <textarea
            value={form.careInstructions}
            onChange={(event) => setField('careInstructions', event.target.value)}
            placeholder="One instruction per line"
            className="mt-1 min-h-24 w-full border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <h4 className="md:col-span-2 text-sm font-semibold uppercase tracking-wide text-gray-600">Sustainability evidence</h4>
        <label className="md:col-span-2 text-sm font-semibold text-dark">
          Sustainability summary
          <textarea
            value={form.sustainabilitySummary}
            onChange={(event) => setField('sustainabilitySummary', event.target.value)}
            className="mt-1 min-h-24 w-full border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="md:col-span-2 text-sm font-semibold text-dark">
          Sustainability source
          <input
            value={form.sustainabilitySource}
            onChange={(event) => setField('sustainabilitySource', event.target.value)}
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="md:col-span-2 text-sm font-semibold text-dark">
          Impact metrics
          <textarea
            value={form.impactMetrics}
            onChange={(event) => setField('impactMetrics', event.target.value)}
            placeholder="Label | Value | Unit | Source"
            className="mt-1 min-h-24 w-full border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="md:col-span-2 text-sm font-semibold text-dark">
          Certifications
          <textarea
            value={form.certifications}
            onChange={(event) => setField('certifications', event.target.value)}
            placeholder="Name | Issuer | URL"
            className="mt-1 min-h-24 w-full border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <h4 className="md:col-span-2 text-sm font-semibold uppercase tracking-wide text-gray-600">Manufacturing</h4>
        <label className="text-sm font-semibold text-dark">
          Manufacturing location
          <input value={form.manufacturingLocation} onChange={(event) => setField('manufacturingLocation', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-semibold text-dark">
          Manufacturing facility
          <input value={form.manufacturingFacility} onChange={(event) => setField('manufacturingFacility', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="md:col-span-2 text-sm font-semibold text-dark">
          Manufacturing process
          <textarea value={form.manufacturingProcess} onChange={(event) => setField('manufacturingProcess', event.target.value)} className="mt-1 min-h-24 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="md:col-span-2 text-sm font-semibold text-dark">
          Manufacturing source
          <input value={form.manufacturingSource} onChange={(event) => setField('manufacturingSource', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <h4 className="md:col-span-2 text-sm font-semibold uppercase tracking-wide text-gray-600">Durability</h4>
        <label className="md:col-span-2 text-sm font-semibold text-dark">
          Durability summary
          <textarea value={form.durabilitySummary} onChange={(event) => setField('durabilitySummary', event.target.value)} className="mt-1 min-h-24 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-semibold text-dark">
          Repairability
          <input value={form.durabilityRepairability} onChange={(event) => setField('durabilityRepairability', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-semibold text-dark">
          Expected use
          <input value={form.durabilityExpectedUse} onChange={(event) => setField('durabilityExpectedUse', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="md:col-span-2 text-sm font-semibold text-dark">
          Durability source
          <input value={form.durabilitySource} onChange={(event) => setField('durabilitySource', event.target.value)} className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-dark">
          <input type="checkbox" checked={form.isOnSale} onChange={(event) => setField('isOnSale', event.target.checked)} />
          On sale
        </label>
        <div className="flex gap-2 md:justify-end">
          {editingId && (
            <button type="button" onClick={resetForm} className="button-control button-control--secondary button-control--compact">
              Cancel
            </button>
          )}
          <button type="submit" disabled={saving} className="button-control button-control--primary button-control--compact">
            {saving ? 'Saving...' : 'Save product'}
          </button>
        </div>
      </form>

      {loading ? (
        <p role="status" className="border border-gray-200 bg-white p-4 text-sm text-gray-600">Loading products...</p>
      ) : products.length === 0 ? (
        <section className="border border-gray-200 bg-white p-8 text-center">
          <h3 className="text-lg font-semibold text-dark">No products found</h3>
          <p className="mt-2 text-sm text-gray-600">Add a product or change the current filters.</p>
        </section>
      ) : (
        <div className="overflow-x-auto border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-light text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product._id}>
                  <td className="px-4 py-3 font-semibold text-dark">{product.name}</td>
                  <td className="px-4 py-3 text-gray-700">{product.gender} / {product.category}</td>
                  <td className="px-4 py-3 text-gray-700">{product.price?.current}</td>
                  <td className="px-4 py-3 text-gray-700">{product.stock ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => editProduct(product)} className="button-control button-control--secondary button-control--compact">Edit</button>
                      <button type="button" onClick={() => deleteProduct(product)} className="button-control button-control--danger button-control--compact">Delete</button>
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
