import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faStarHalfAlt } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarEmpty } from '@fortawesome/free-regular-svg-icons';
import toast from 'react-hot-toast';
import { backInStockApi } from '../api/backInStockApi';
import { productsApi } from '../api/productsApi';
import { recommendationsApi } from '../api/recommendationsApi';
import { reviewsApi } from '../api/reviewsApi';
import ProductCard from '../components/ProductCard';
import WishlistButton from '../components/WishlistButton';
import { config } from '../config/config';
import { loadFallbackCatalogProducts } from '../services/catalog/catalogService';
import { normalizeProduct, normalizeProducts } from '../services/catalog/normalizeProduct';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const DEFAULT_REVIEW_FORM = {
  rating: 5,
  title: '',
  comment: '',
  fit: '',
};

const fitLabels = {
  runs_small: 'Runs small',
  true_to_size: 'True to size',
  runs_large: 'Runs large',
};

const hasManufacturingDetails = (manufacturing = {}) =>
  Boolean(manufacturing.source && (manufacturing.location || manufacturing.facility || manufacturing.process));

const hasDurabilityDetails = (durability = {}) =>
  Boolean(durability.source && (durability.summary || durability.repairability || durability.expectedUse));

const hasSustainabilityDetails = (sustainability = {}) =>
  Boolean(
    (sustainability.summary && sustainability.source) ||
      sustainability.impactMetrics?.length ||
      sustainability.certifications?.length ||
      hasManufacturingDetails(sustainability.manufacturing) ||
      hasDurabilityDetails(sustainability.durability)
  );

const emptyReviewSummary = {
  averageRating: 0,
  reviewCount: 0,
  ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  fitSummary: {
    runsSmall: 0,
    trueToSize: 0,
    runsLarge: 0,
    total: 0,
    dominant: null,
  },
};

const isBackendProductId = (id = '') => OBJECT_ID_PATTERN.test(id);

const renderStars = (rating = 0) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  for (let index = 0; index < fullStars; index += 1) {
    stars.push(<FontAwesomeIcon key={`full-${index}`} icon={faStar} className="text-[#d4a017]" />);
  }
  if (hasHalf) {
    stars.push(<FontAwesomeIcon key="half" icon={faStarHalfAlt} className="text-[#d4a017]" />);
  }
  for (let index = stars.length; index < 5; index += 1) {
    stars.push(
      <FontAwesomeIcon key={`empty-${index}`} icon={faStarEmpty} className="text-[#d4a017]" />
    );
  }

  return stars;
};

const fallbackRelatedProducts = (products, currentProduct, limit = 4) =>
  products
    .filter((product) => product.id !== currentProduct.id)
    .sort((a, b) => {
      const aScore =
        (a.gender === currentProduct.gender && a.category === currentProduct.category ? 3 : 0) +
        (a.category === currentProduct.category ? 2 : 0) +
        a.rating / 10;
      const bScore =
        (b.gender === currentProduct.gender && b.category === currentProduct.category ? 3 : 0) +
        (b.category === currentProduct.category ? 2 : 0) +
        b.rating / 10;

      return bScore - aScore;
    })
    .slice(0, limit);

export const reviewErrorMessageFromError = (error) => {
  const status = error?.response?.status;

  if (status === 401) return 'Sign in to review verified purchases.';
  if (status === 403) return 'Reviews are available after a verified purchase.';
  if (status === 409) return 'You have already reviewed this product.';
  if (status === 400) return error?.response?.data?.message || 'Check your review fields.';

  return 'We could not submit your review. Try again.';
};

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem, openCart } = useCartStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userEmail = useAuthStore((state) => state.user?.email || '');
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [selectedSize, setSelectedSize] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(emptyReviewSummary);
  const [reviewForm, setReviewForm] = useState(DEFAULT_REVIEW_FORM);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [backInStockEmail, setBackInStockEmail] = useState('');
  const [backInStockConsent, setBackInStockConsent] = useState(false);
  const [isSubmittingBackInStock, setIsSubmittingBackInStock] = useState(false);
  const [backInStockStatus, setBackInStockStatus] = useState({ type: '', message: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadProduct = async () => {
      setIsLoading(true);
      setError('');
      setProduct(null);
      setRelatedProducts([]);

      try {
        let normalizedProduct;

        if (isBackendProductId(id)) {
          const response = await productsApi.getById(id);

          if (!response?.success) {
            throw new Error(response?.message || 'Product request failed');
          }

          normalizedProduct = normalizeProduct(response.data, { source: 'backend' });
        } else {
          const localGroup = id.match(/^local-(male|female)-/)?.[1];
          const fallback = await loadFallbackCatalogProducts({
            page: 1,
            limit: 100,
            ...(localGroup ? { gender: localGroup } : {}),
          });
          normalizedProduct = fallback.products.find((item) => item.id === id);

          if (!normalizedProduct) {
            throw new Error('Product not found');
          }

          if (isMounted) {
            setRelatedProducts(fallbackRelatedProducts(fallback.products, normalizedProduct));
          }
        }

        if (!isMounted) return;

        setProduct(normalizedProduct);
        setActiveImage(normalizedProduct.gallery?.[0] || normalizedProduct.image);
        setSelectedSize(normalizedProduct.sizes?.[0] || null);
      } catch (loadError) {
        if (!isMounted) return;

        setError(
          loadError.message === 'Product not found'
            ? 'Product not found'
            : 'We could not load this product. Try again from the collection.'
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!product || !isBackendProductId(product.id)) return;

    let isMounted = true;

    const loadRelated = async () => {
      try {
        const response = await recommendationsApi.getRecommendations({ productId: product.id, limit: 4 });
        if (!isMounted) return;

        if (response?.success) {
          setRelatedProducts(normalizeProducts(response.data || [], { source: 'backend' }));
        } else {
          setRelatedProducts([]);
        }
      } catch {
        try {
          const response = await productsApi.getRelated(product.id, { limit: 4 });
          if (!isMounted) return;

          if (response?.success) {
            setRelatedProducts(normalizeProducts(response.data || [], { source: 'backend' }));
          } else {
            setRelatedProducts([]);
          }
        } catch {
          if (isMounted) {
            setRelatedProducts([]);
          }
        }
      }
    };

    loadRelated();

    return () => {
      isMounted = false;
    };
  }, [product]);

  useEffect(() => {
    if (userEmail && !backInStockEmail) {
      setBackInStockEmail(userEmail);
    }
  }, [backInStockEmail, userEmail]);

  useEffect(() => {
    if (!product || !config.features.reviews) return;

    if (!isBackendProductId(product.id)) {
      setReviews([]);
      setReviewSummary({
        ...emptyReviewSummary,
        averageRating: product.rating,
        reviewCount: product.reviewCount,
        ratingDistribution: product.ratingDistribution,
        fitSummary: product.fitSummary,
      });
      return;
    }

    let isMounted = true;

    const loadReviews = async () => {
      setIsReviewsLoading(true);
      try {
        const response = await reviewsApi.getReviews(product.id, { limit: 20 });
        if (!isMounted) return;

        if (response?.success) {
          setReviews(response.data || []);
          setReviewSummary(response.summary || emptyReviewSummary);
        } else {
          setReviews([]);
          setReviewSummary(emptyReviewSummary);
        }
      } catch {
        if (isMounted) {
          setReviews([]);
          setReviewSummary(emptyReviewSummary);
        }
      } finally {
        if (isMounted) {
          setIsReviewsLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, [product]);

  const price = product?.price?.current || 0;
  const originalPrice = product?.price?.original || price;
  const hasDiscount = originalPrice > price;
  const isOutOfStock = product?.stock <= 0;
  const rating = reviewSummary.averageRating || product?.rating || 0;
  const reviewCount = reviewSummary.reviewCount || product?.reviewCount || 0;
  const fitSummary = reviewSummary.fitSummary || product?.fitSummary || emptyReviewSummary.fitSummary;
  const fitDominantLabel = fitLabels[fitSummary.dominant] || null;
  const fitCopy = product?.fitGuide?.summary || 'Runs true to size for most shoppers.';
  const gallery = useMemo(() => product?.gallery?.length ? product.gallery : [product?.image].filter(Boolean), [product]);
  const sustainability = product?.sustainability || {};
  const manufacturing = sustainability.manufacturing || {};
  const durability = sustainability.durability || {};
  const showManufacturing = hasManufacturingDetails(manufacturing);
  const showDurability = hasDurabilityDetails(durability);
  const showSustainability = hasSustainabilityDetails(sustainability);

  const handleAddToCart = async () => {
    if (!product || !selectedSize) return;

    const result = await addItem(
      {
        _id: product.raw?._id || product.id,
        name: product.name,
        image: product.image,
        price: {
          current: price,
          original: originalPrice,
        },
      },
      1,
      selectedSize
    );

    if (result.success) {
      toast.success(`${product.name} added to cart!`);
      openCart();
    } else {
      toast.error(result.message || 'Failed to add to cart');
    }
  };

  const updateReviewForm = (field, value) => {
    setReviewForm((current) => ({ ...current, [field]: value }));
    setReviewError('');
    setReviewSuccess('');
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      setReviewError('Sign in to review verified purchases.');
      return;
    }

    if (!isBackendProductId(product.id)) {
      setReviewError('Reviews are available after a verified purchase.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const payload = {
        rating: Number(reviewForm.rating),
        title: reviewForm.title,
        comment: reviewForm.comment,
        ...(reviewForm.fit ? { fit: reviewForm.fit } : {}),
      };
      const response = await reviewsApi.createReview(product.id, payload);

      if (response?.success) {
        setReviews((current) => [response.data, ...current]);
        setReviewSummary(response.summary || reviewSummary);
        setReviewForm(DEFAULT_REVIEW_FORM);
        setReviewSuccess('Review submitted.');
        toast.success('Review submitted.');
      }
    } catch (submitError) {
      setReviewError(reviewErrorMessageFromError(submitError));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleBackInStockSubmit = async (event) => {
    event.preventDefault();

    if (!backInStockConsent) {
      setBackInStockStatus({
        type: 'error',
        message: 'Confirm notification consent before submitting.',
      });
      return;
    }

    setIsSubmittingBackInStock(true);
    setBackInStockStatus({ type: '', message: '' });

    try {
      const response = await backInStockApi.createRequest({
        productId: product.raw?._id || product.id,
        size: Number(selectedSize || product.sizes?.[0]),
        email: backInStockEmail,
        consent: true,
      });

      if (response?.success) {
        setBackInStockStatus({
          type: 'success',
          message: response.message || 'Back-in-stock request saved.',
        });
        toast.success('Back-in-stock request saved.');
      }
    } catch (submitError) {
      setBackInStockStatus({
        type: 'error',
        message: submitError.response?.data?.message || 'We could not save this request.',
      });
    } finally {
      setIsSubmittingBackInStock(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen px-4 py-16">
        <p role="status" className="text-center text-lg text-[#262b2c]">Loading product details...</p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen px-4 py-16 text-center">
        <h1 className="mb-4 text-3xl font-semibold text-[#262b2c]">
          {error === 'Product not found' ? 'Product not found' : 'We could not load this product.'}
        </h1>
        <p className="mb-6 text-[#6b6f68]">
          {error === 'Product not found'
            ? 'Try again from the collection.'
            : 'We could not load this product. Try again from the collection.'}
        </p>
        <Link
          to="/collection"
          className="button-control button-control--primary"
        >
          Shop collection
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#262b2c]">
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:py-16">
        <div>
          <div className="bg-[#f1f1ef]">
            <img
              src={activeImage}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          </div>
          {gallery.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-3" aria-label="Product gallery">
              {gallery.map((image) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(image)}
                  aria-label={`Show ${product.name} image`}
                  aria-pressed={activeImage === image}
                  className={`min-h-[64px] w-16 border bg-white p-1 ${
                    activeImage === image ? 'border-[#6e7051]' : 'border-[#d9d9d2]'
                  }`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-2 text-sm font-semibold text-[#6b6f68]">{product.category}</p>
            <h1 className="text-3xl font-semibold leading-tight text-[#262b2c]">{product.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>
                {renderStars(rating)}
              </div>
              <span className="text-sm text-[#6b6f68]">
                {rating.toFixed(1)} average from {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasDiscount && (
              <span className="text-lg text-[#6b6f68] line-through">${originalPrice.toFixed(2)}</span>
            )}
            <span className={`text-3xl font-semibold ${hasDiscount ? 'text-[#b42318]' : 'text-[#262b2c]'}`}>
              ${price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="bg-[#b42318] px-2 py-1 text-xs font-semibold text-white">SALE</span>
            )}
          </div>

          <p className="max-w-2xl text-base leading-7 text-[#6b6f68]">
            {product.description || `${product.name} is built for comfortable everyday movement.`}
          </p>

          <div className="grid gap-4 border-y border-[#d9d9d2] py-5 md:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="mb-3 text-sm font-semibold">Size</h2>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Select size">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    aria-pressed={selectedSize === size}
                    className={`choice-button ${selectedSize === size ? 'choice-button--selected' : ''}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#f1f1ef] p-4">
              <h2 className="mb-2 text-sm font-semibold">Fit confidence</h2>
              <p className="text-sm leading-6 text-[#262b2c]">{fitCopy}</p>
              {product.fitGuide?.sizeNote && (
                <p className="mt-2 text-sm text-[#6b6f68]">{product.fitGuide.sizeNote}</p>
              )}
              {fitDominantLabel && (
                <p className="mt-2 text-sm font-semibold text-[#6e7051]">
                  Review trend: {fitDominantLabel}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!selectedSize || isOutOfStock}
              className="button-control button-control--primary button-control--grow"
            >
              Add to Cart
            </button>
            <WishlistButton product={product} showText className="sm:min-w-[180px]" />
          </div>
          {isOutOfStock && <p className="text-sm text-[#b42318]">This size is currently unavailable.</p>}

          {isOutOfStock && isBackendProductId(product.id) && (
            <form onSubmit={handleBackInStockSubmit} className="border border-[#d9d9d2] p-4">
              <h2 className="text-base font-semibold">Notify me when available</h2>
              <div className="mt-3 grid gap-3">
                <label className="text-sm font-semibold">
                  Email
                  <input
                    type="email"
                    required
                    value={backInStockEmail}
                    onChange={(event) => setBackInStockEmail(event.target.value)}
                    className="mt-1 min-h-[44px] w-full border border-[#d9d9d2] px-3 py-2 font-normal"
                  />
                </label>
                <label className="flex items-start gap-2 text-sm text-[#6b6f68]">
                  <input
                    type="checkbox"
                    checked={backInStockConsent}
                    onChange={(event) => setBackInStockConsent(event.target.checked)}
                    className="mt-1"
                  />
                  Email me about this product and size when availability changes.
                </label>
              </div>
              {backInStockStatus.message && (
                <p
                  role={backInStockStatus.type === 'error' ? 'alert' : 'status'}
                  className={`mt-3 text-sm font-semibold ${
                    backInStockStatus.type === 'error' ? 'text-[#b42318]' : 'text-[#6e7051]'
                  }`}
                >
                  {backInStockStatus.message}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmittingBackInStock}
                className="button-control button-control--dark button-control--full mt-4"
              >
                {isSubmittingBackInStock ? 'Saving...' : 'Notify me'}
              </button>
            </form>
          )}

          <div className="grid gap-4 border-t border-[#d9d9d2] pt-5 md:grid-cols-2">
            <div>
              <h2 className="mb-2 text-sm font-semibold">Materials</h2>
              {product.materials.length > 0 ? (
                <dl className="space-y-2 text-sm">
                  {product.materials.map((item) => (
                    <div key={`${item.label}-${item.value}`}>
                      <dt className="font-semibold">{item.label}</dt>
                      <dd className="text-[#6b6f68]">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-[#6b6f68]">Material details are not available for this product yet.</p>
              )}
            </div>
            <div>
              <h2 className="mb-2 text-sm font-semibold">Care</h2>
              {product.careInstructions.length > 0 ? (
                <ul className="space-y-2 text-sm text-[#6b6f68]">
                  {product.careInstructions.map((instruction) => (
                    <li key={instruction}>{instruction}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#6b6f68]">Care instructions are not available for this product yet.</p>
              )}
            </div>
          </div>

          <section className="border-t border-[#d9d9d2] pt-5">
            <div className="mb-4">
              <h2 className="text-base font-semibold">Sustainability details</h2>
              <p className="mt-1 text-sm text-[#6b6f68]">
                Product-level impact, manufacturing, and durability notes are shown when source details are captured.
              </p>
            </div>

            {showSustainability ? (
              <div className="space-y-5 text-sm">
                {sustainability.summary && sustainability.source && (
                  <div>
                    <p className="leading-6 text-[#262b2c]">{sustainability.summary}</p>
                    <p className="mt-1 text-[#6b6f68]">
                      <span className="font-semibold text-[#262b2c]">Source:</span> {sustainability.source}
                    </p>
                  </div>
                )}

                {sustainability.impactMetrics?.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-semibold">Impact metrics</h3>
                    <dl className="grid gap-3 sm:grid-cols-2">
                      {sustainability.impactMetrics.map((metric) => (
                        <div key={`${metric.label}-${metric.value}`} className="border border-[#d9d9d2] p-3">
                          <dt className="font-semibold">{metric.label}</dt>
                          <dd className="mt-1 text-[#262b2c]">
                            {metric.value}{metric.unit ? ` ${metric.unit}` : ''}
                          </dd>
                          <dd className="mt-1 text-xs text-[#6b6f68]">Source: {metric.source}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {showManufacturing && (
                  <div>
                    <h3 className="mb-2 font-semibold">Manufacturing</h3>
                    <dl className="space-y-2">
                      {manufacturing.location && (
                        <div>
                          <dt className="font-semibold">Location</dt>
                          <dd className="text-[#6b6f68]">{manufacturing.location}</dd>
                        </div>
                      )}
                      {manufacturing.facility && (
                        <div>
                          <dt className="font-semibold">Facility</dt>
                          <dd className="text-[#6b6f68]">{manufacturing.facility}</dd>
                        </div>
                      )}
                      {manufacturing.process && (
                        <div>
                          <dt className="font-semibold">Process</dt>
                          <dd className="text-[#6b6f68]">{manufacturing.process}</dd>
                        </div>
                      )}
                    </dl>
                    <p className="mt-2 text-xs text-[#6b6f68]">Source: {manufacturing.source}</p>
                  </div>
                )}

                {showDurability && (
                  <div>
                    <h3 className="mb-2 font-semibold">Durability and repair</h3>
                    <dl className="space-y-2">
                      {durability.summary && (
                        <div>
                          <dt className="font-semibold">Durability</dt>
                          <dd className="text-[#6b6f68]">{durability.summary}</dd>
                        </div>
                      )}
                      {durability.repairability && (
                        <div>
                          <dt className="font-semibold">Repairability</dt>
                          <dd className="text-[#6b6f68]">{durability.repairability}</dd>
                        </div>
                      )}
                      {durability.expectedUse && (
                        <div>
                          <dt className="font-semibold">Expected use</dt>
                          <dd className="text-[#6b6f68]">{durability.expectedUse}</dd>
                        </div>
                      )}
                    </dl>
                    <p className="mt-2 text-xs text-[#6b6f68]">Source: {durability.source}</p>
                  </div>
                )}

                {sustainability.certifications?.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-semibold">Certifications</h3>
                    <ul className="space-y-2 text-[#6b6f68]">
                      {sustainability.certifications.map((certification) => (
                        <li key={`${certification.name}-${certification.issuer}`}>
                          <span className="font-semibold text-[#262b2c]">{certification.name}</span>
                          {' '}issued by {certification.issuer}
                          {certification.url ? (
                            <a
                              href={certification.url}
                              className="ml-1 font-semibold text-[#6e7051] underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              View source
                            </a>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#6b6f68]">
                Sustainability details are not available for this product yet.
              </p>
            )}
          </section>
        </div>
      </section>

      {config.features.reviews && (
        <section className="border-t border-[#d9d9d2] px-4 py-10 md:px-6">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div>
              <h2 className="mb-4 text-xl font-semibold">Customer Reviews</h2>
              {isReviewsLoading && <p role="status" className="text-[#6b6f68]">Loading reviews...</p>}
              {!isReviewsLoading && reviews.length === 0 && (
                <div>
                  <h3 className="text-base font-semibold">No reviews yet</h3>
                  <p className="mt-1 text-sm text-[#6b6f68]">
                    Be the first verified buyer to share how these fit.
                  </p>
                </div>
              )}
              <div className="space-y-5">
                {reviews.map((review) => (
                  <article key={review._id || `${review.title}-${review.createdAt}`} className="border-b border-[#d9d9d2] pb-5">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <div className="flex gap-1" aria-label={`${review.rating} out of 5 stars`}>
                        {renderStars(review.rating)}
                      </div>
                      {review.verifiedPurchase && (
                        <span className="bg-[#f1f1ef] px-2 py-1 text-xs font-semibold text-[#6e7051]">
                          Verified purchase
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 text-base font-semibold">{review.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#262b2c]">{review.comment}</p>
                    <p className="mt-2 text-sm text-[#6b6f68]">
                      {review.user?.name || 'PLASHOE customer'}
                      {review.fit ? ` - Fit: ${fitLabels[review.fit]}` : ''}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="border border-[#d9d9d2] p-4">
              <h2 className="mb-4 text-xl font-semibold">Write a review</h2>
              {!isAuthenticated && (
                <p className="mb-4 text-sm text-[#6b6f68]">Sign in to review verified purchases.</p>
              )}
              <div className="space-y-4">
                <label className="block text-sm font-semibold">
                  Rating
                  <select
                    value={reviewForm.rating}
                    onChange={(event) => updateReviewForm('rating', event.target.value)}
                    className="mt-1 min-h-[44px] w-full border border-[#d9d9d2] px-3 py-2 font-normal"
                  >
                    <option value={5}>5 stars</option>
                    <option value={4}>4 stars</option>
                    <option value={3}>3 stars</option>
                    <option value={2}>2 stars</option>
                    <option value={1}>1 star</option>
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  Title
                  <input
                    value={reviewForm.title}
                    onChange={(event) => updateReviewForm('title', event.target.value)}
                    maxLength={120}
                    required
                    className="mt-1 min-h-[44px] w-full border border-[#d9d9d2] px-3 py-2 font-normal"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Comment
                  <textarea
                    value={reviewForm.comment}
                    onChange={(event) => updateReviewForm('comment', event.target.value)}
                    maxLength={1000}
                    required
                    rows={4}
                    className="mt-1 w-full border border-[#d9d9d2] px-3 py-2 font-normal"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Fit
                  <select
                    value={reviewForm.fit}
                    onChange={(event) => updateReviewForm('fit', event.target.value)}
                    className="mt-1 min-h-[44px] w-full border border-[#d9d9d2] px-3 py-2 font-normal"
                  >
                    <option value="">Select fit feedback</option>
                    <option value="runs_small">Runs small</option>
                    <option value="true_to_size">True to size</option>
                    <option value="runs_large">Runs large</option>
                  </select>
                </label>
              </div>
              {reviewError && (
                <p role="alert" className="mt-4 text-sm font-semibold text-[#b42318]">{reviewError}</p>
              )}
              {reviewSuccess && (
                <p role="status" className="mt-4 text-sm font-semibold text-[#6e7051]">{reviewSuccess}</p>
              )}
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="button-control button-control--primary button-control--full mt-5"
              >
                {isSubmittingReview ? 'Submitting...' : 'Submit review'}
              </button>
            </form>
          </div>
        </section>
      )}

      <section className="border-t border-[#d9d9d2] px-4 py-10 md:px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-6 text-xl font-semibold">You may also like</h2>
          {relatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <div key={relatedProduct.id}>
                  <ProductCard product={relatedProduct} />
                  {relatedProduct.recommendationReason && (
                    <p className="mt-2 text-sm text-[#6b6f68]">{relatedProduct.recommendationReason}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6b6f68]">No related products are available right now.</p>
          )}
        </div>
      </section>
    </main>
  );
}
