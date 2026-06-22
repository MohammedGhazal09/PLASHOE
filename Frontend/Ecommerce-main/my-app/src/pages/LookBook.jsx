import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { lookbookApi } from '../api/lookbookApi';
import lookbookHero from '../assets/images/lookbook-hero.webp';
import { normalizeProduct } from '../services/catalog/normalizeProduct';
import { useCartStore } from '../store/cartStore';

const fallbackLooks = [
  {
    id: 1,
    title: 'Street Style',
    description: 'Urban movement with comfortable sneakers.',
    image: '/database/Male/0.webp',
    link: '/men',
  },
  {
    id: 2,
    title: 'Casual Elegance',
    description: 'Everyday style with cleaner silhouettes.',
    image: '/database/Female/0.webp',
    link: '/women',
  },
  {
    id: 3,
    title: 'Summer Vibes',
    description: 'Light and breathable designs.',
    image: '/database/Male/1.webp',
    link: '/collection',
  },
  {
    id: 4,
    title: 'Winter Collection',
    description: 'Warm and practical footwear.',
    image: '/database/Female/1.webp',
    link: '/collection',
  },
];

const productCartPayload = (product) => ({
  _id: product.raw?._id || product.id,
  name: product.name,
  image: product.image,
  price: {
    current: product.price.current,
    original: product.price.original,
  },
});

const normalizeLookbookEntry = (entry = {}) => ({
  ...entry,
  id: entry._id || entry.id || entry.title,
  hotspots: (entry.hotspots || [])
    .filter((hotspot) => hotspot.product)
    .map((hotspot) => ({
      ...hotspot,
      product: normalizeProduct(hotspot.product, { source: 'backend' }),
    })),
  bundle: entry.bundle
    ? {
        ...entry.bundle,
        items: (entry.bundle.items || [])
          .filter((item) => item.product)
          .map((item) => ({
            ...item,
            product: normalizeProduct(item.product, { source: 'backend' }),
          })),
      }
    : null,
});

export default function LookBook() {
  const { addItem, openCart } = useCartStore();
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedHotspots, setSelectedHotspots] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({});

  useEffect(() => {
    let isMounted = true;

    const loadLookbook = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await lookbookApi.getEntries();
        if (!isMounted) return;

        if (response?.success) {
          setEntries((response.data || []).map(normalizeLookbookEntry));
        } else {
          setEntries([]);
        }
      } catch {
        if (isMounted) {
          setLoadError('We could not load shoppable lookbook content.');
          setEntries([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadLookbook();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeEntries = useMemo(
    () =>
      entries.map((entry) => ({
        ...entry,
        selectedHotspot:
          entry.hotspots[selectedHotspots[entry.id] || 0] || entry.hotspots[0] || null,
      })),
    [entries, selectedHotspots]
  );

  const selectedSizeFor = (key, product, fallbackSize) =>
    selectedSizes[key] || fallbackSize || product.sizes?.[0] || '';

  const updateSelectedSize = (key, value) =>
    setSelectedSizes((current) => ({
      ...current,
      [key]: Number(value),
    }));

  const addCartItem = async (product, size, quantity = 1) => {
    if (!product || !size) {
      return { success: false, message: 'Choose a size before adding to cart.' };
    }

    if (product.stock <= 0) {
      return { success: false, message: `${product.name} is out of stock.` };
    }

    return addItem(productCartPayload(product), quantity, Number(size));
  };

  const handleAddProduct = async (entry, product, size) => {
    const result = await addCartItem(product, size, 1);

    if (result.success) {
      openCart();
      toast.success(`${product.name} added to cart.`);
    } else {
      toast.error(result.message || 'Failed to add product to cart.');
    }
  };

  const handleAddBundle = async (entry) => {
    const availableItems = (entry.bundle?.items || []).filter((item) => item.product?.stock > 0);
    let added = 0;
    const failed = [];

    for (const item of availableItems) {
      const key = `${entry.id}:bundle:${item.product.id}`;
      const size = selectedSizeFor(key, item.product, item.defaultSize);

      if (!item.product.sizes.includes(Number(size))) {
        failed.push(item.product.name);
        continue;
      }

      const result = await addCartItem(item.product, size, item.quantity || 1);
      if (result.success) {
        added += 1;
      } else {
        failed.push(item.product.name);
      }
    }

    if (added > 0) {
      openCart();
      toast.success(`${added} bundle item(s) added to cart.`);
    }

    if (failed.length > 0 || added === 0) {
      toast.error(
        failed.length > 0
          ? 'Some bundle items need a different size or are unavailable.'
          : 'No bundle items are currently available.'
      );
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen px-4 py-16">
        <p role="status" className="text-center text-lg text-[#262b2c]">Loading lookbook...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#262b2c]">
      <section
        className="lookbook-hero"
        style={{ backgroundImage: `url(${lookbookHero})` }}
      >
        <div className="lookbook-hero__content">
          <p className="lookbook-hero__eyebrow">PLASHOE Editorial</p>
          <h1 className="lookbook-hero__title" aria-label="The Lookbook">
            <span>The</span>
            <span>Lookbook</span>
          </h1>
          <p className="lookbook-hero__copy">
            Curated scenes, tagged pairs, and outfit builds for the latest PLASHOE silhouettes.
          </p>
          <a className="lookbook-hero__link" href="#lookbook-scenes">
            Explore scenes
          </a>
        </div>
      </section>

      {activeEntries.length > 0 ? (
        <section id="lookbook-scenes" className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:px-6">
          {activeEntries.map((entry) => {
            const selectedHotspot = entry.selectedHotspot;
            const selectedProduct = selectedHotspot?.product;
            const selectedProductKey = selectedProduct ? `${entry.id}:hotspot:${selectedProduct.id}` : '';
            const selectedProductSize = selectedProduct
              ? selectedSizeFor(selectedProductKey, selectedProduct)
              : '';

            return (
              <article key={entry.id} className="grid gap-6 border-b border-[#d9d9d2] pb-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
                <div className="relative bg-[#f1f1ef]">
                  <img src={entry.image} alt={entry.title} className="aspect-[4/5] w-full object-cover md:aspect-[16/10]" />
                  {entry.hotspots.map((hotspot, index) => (
                    <button
                      key={`${hotspot.product.id}-${hotspot.x}-${hotspot.y}`}
                      type="button"
                      onClick={() =>
                        setSelectedHotspots((current) => ({
                          ...current,
                          [entry.id]: index,
                        }))
                      }
                      aria-label={`View ${hotspot.product.name} in ${entry.title}`}
                      className={`absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white text-sm font-semibold shadow ${
                        selectedHotspot?.product.id === hotspot.product.id
                          ? 'bg-[#262b2c] text-white'
                          : 'bg-[#6e7051] text-white'
                      }`}
                      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-5">
                  <div>
                    <p className="text-sm font-semibold uppercase text-[#6e7051]">Shoppable scene</p>
                    <h2 className="mt-1 text-2xl font-semibold">{entry.title}</h2>
                    {entry.description && <p className="mt-2 text-sm leading-6 text-[#6b6f68]">{entry.description}</p>}
                  </div>

                  {selectedProduct ? (
                    <section className="border border-[#d9d9d2] p-4">
                      <p className="text-xs font-semibold uppercase text-[#6b6f68]">{selectedHotspot.label || 'Tagged product'}</p>
                      <h3 className="mt-1 text-lg font-semibold">{selectedProduct.name}</h3>
                      <p className="mt-1 text-sm text-[#6b6f68]">{selectedProduct.category}</p>
                      <p className="mt-3 text-xl font-semibold">${selectedProduct.price.current.toFixed(2)}</p>
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <label className="text-sm font-semibold text-[#262b2c]">
                          Size
                          <select
                            value={selectedProductSize}
                            onChange={(event) => updateSelectedSize(selectedProductKey, event.target.value)}
                            className="mt-1 min-h-11 w-full border border-[#d9d9d2] px-3 py-2 text-sm font-normal sm:w-32"
                          >
                            {selectedProduct.sizes.map((size) => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          disabled={selectedProduct.stock <= 0}
                          onClick={() => handleAddProduct(entry, selectedProduct, selectedProductSize)}
                          className="button-control button-control--primary button-control--compact self-end"
                        >
                          Add tagged product
                        </button>
                      </div>
                    </section>
                  ) : (
                    <p className="border border-[#d9d9d2] p-4 text-sm text-[#6b6f68]">No products are tagged in this scene yet.</p>
                  )}

                  {entry.bundle?.items?.length > 0 && (
                    <section className="border border-[#d9d9d2] p-4">
                      <h3 className="text-lg font-semibold">{entry.bundle.title}</h3>
                      {entry.bundle.description && <p className="mt-1 text-sm text-[#6b6f68]">{entry.bundle.description}</p>}
                      <div className="mt-4 grid gap-3">
                        {entry.bundle.items.map((item) => {
                          const key = `${entry.id}:bundle:${item.product.id}`;
                          const size = selectedSizeFor(key, item.product, item.defaultSize);

                          return (
                            <div key={key} className="flex flex-col gap-2 border-t border-[#d9d9d2] pt-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="font-semibold">{item.product.name}</p>
                                <p className="text-sm text-[#6b6f68]">
                                  Qty {item.quantity || 1} · ${item.product.price.current.toFixed(2)}
                                </p>
                              </div>
                              <label className="text-sm font-semibold text-[#262b2c]">
                                Size
                                <select
                                  value={size}
                                  onChange={(event) => updateSelectedSize(key, event.target.value)}
                                  className="ml-2 min-h-10 border border-[#d9d9d2] px-2 py-1 text-sm font-normal"
                                >
                                  {item.product.sizes.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddBundle(entry)}
                        className="button-control button-control--dark button-control--full mt-4"
                      >
                        Add available bundle items
                      </button>
                    </section>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section id="lookbook-scenes" className="px-[5%] py-12">
          {loadError && <p className="mb-6 border border-[#d9d9d2] p-3 text-sm text-[#6b6f68]">{loadError}</p>}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {fallbackLooks.map((look) => (
              <Link key={look.id} to={look.link} className="group relative aspect-[3/4] overflow-hidden">
                <img src={look.image} alt={look.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 flex items-end bg-black/20">
                  <div className="p-5 text-white">
                    <h2 className="text-xl font-semibold">{look.title}</h2>
                    <p className="mt-1 text-sm text-white/85">{look.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
