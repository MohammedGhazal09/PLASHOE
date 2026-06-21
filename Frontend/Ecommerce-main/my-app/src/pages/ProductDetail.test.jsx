import { vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import ProductDetail from './ProductDetail';
import { backInStockApi } from '../api/backInStockApi';
import { productsApi } from '../api/productsApi';
import { recommendationsApi } from '../api/recommendationsApi';
import { reviewsApi } from '../api/reviewsApi';
import { loadFallbackCatalogProducts } from '../services/catalog/catalogService';
import { renderWithRouter } from '../test/routerTestUtils';

const {
  mockAddItem,
  mockOpenCart,
  mockToastSuccess,
  mockToastError,
  mockAuthState,
} = vi.hoisted(() => ({
  mockAddItem: vi.fn(),
  mockOpenCart: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockAuthState: {
    isAuthenticated: false,
    user: null,
  },
}));

vi.mock('../api/productsApi', () => ({
  productsApi: {
    getById: vi.fn(),
    getRelated: vi.fn(),
  },
}));

vi.mock('../api/backInStockApi', () => ({
  backInStockApi: {
    createRequest: vi.fn(),
  },
}));

vi.mock('../api/recommendationsApi', () => ({
  recommendationsApi: {
    getRecommendations: vi.fn(),
  },
}));

vi.mock('../api/reviewsApi', () => ({
  reviewsApi: {
    getReviews: vi.fn(),
    createReview: vi.fn(),
  },
}));

vi.mock('../services/catalog/catalogService', () => ({
  loadFallbackCatalogProducts: vi.fn(),
}));

vi.mock('../store/cartStore', () => ({
  useCartStore: () => ({
    addItem: mockAddItem,
    openCart: mockOpenCart,
  }),
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector) => (selector ? selector(mockAuthState) : mockAuthState),
}));

vi.mock('../components/WishlistButton', () => ({
  default: ({ product }) => (
    <button type="button" aria-label={`Save ${product.name} to wishlist`}>
      Save for later
    </button>
  ),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: (...args) => mockToastSuccess(...args),
    error: (...args) => mockToastError(...args),
  },
  success: (...args) => mockToastSuccess(...args),
  error: (...args) => mockToastError(...args),
}));

const productId = '507f1f77bcf86cd799439011';

const backendProduct = {
  _id: productId,
  name: 'Detail Runner',
  gender: 'male',
  category: 'Running',
  image: '/images/detail-runner.jpg',
  gallery: ['/images/detail-runner.jpg', '/images/detail-runner-side.jpg'],
  price: { original: 150, current: 120 },
  rating: 4.5,
  reviewCount: 1,
  sizes: [41, 42],
  stock: 8,
  description: 'A breathable runner for long city walks.',
  materials: [{ label: 'Upper', value: 'Recycled knit' }],
  careInstructions: ['Spot clean only'],
  fitGuide: {
    summary: 'Runs true to size for most shoppers.',
    sizeNote: 'Choose your usual EU size.',
  },
  sustainability: {
    summary: 'Upper material includes supplier-documented recycled textile.',
    source: 'Supplier material declaration',
    impactMetrics: [
      { label: 'Recycled upper textile', value: 'Documented', source: 'Supplier material declaration' },
    ],
    certifications: [
      { name: 'Material declaration', issuer: 'PLASHOE supplier compliance' },
    ],
    manufacturing: {
      location: 'Portugal',
      process: 'Cut, stitch, and finish.',
      source: 'Supplier onboarding record',
    },
    durability: {
      summary: 'Care-tested for everyday city wear.',
      repairability: 'Replaceable laces.',
      expectedUse: 'Everyday walking when cleaned as instructed.',
      source: 'PLASHOE care standard',
    },
  },
  fitSummary: {
    runsSmall: 0,
    trueToSize: 1,
    runsLarge: 0,
    total: 1,
    dominant: 'true_to_size',
  },
};

const relatedProduct = {
  _id: '507f1f77bcf86cd799439012',
  name: 'Related Runner',
  gender: 'male',
  category: 'Running',
  image: '/images/related-runner.jpg',
  price: { original: 130, current: 110 },
  rating: 4,
  sizes: [41, 42],
  stock: 4,
  recommendationReason: 'Similar running styles',
};

const review = {
  _id: 'review-1',
  rating: 5,
  title: 'Great shoe',
  comment: 'Comfortable all day.',
  fit: 'true_to_size',
  verifiedPurchase: true,
  createdAt: '2026-06-20T00:00:00.000Z',
  user: { name: 'Verified Buyer' },
};

const renderDetail = (path = `/products/${productId}`) =>
  renderWithRouter(
    <Routes>
      <Route path="/products/:id" element={<ProductDetail />} />
    </Routes>,
    { initialEntries: [path] }
  );

const mockBackendResponses = () => {
  productsApi.getById.mockResolvedValue({ success: true, data: backendProduct });
  productsApi.getRelated.mockResolvedValue({ success: true, data: [relatedProduct] });
  recommendationsApi.getRecommendations.mockResolvedValue({ success: true, data: [relatedProduct] });
  reviewsApi.getReviews.mockResolvedValue({
    success: true,
    summary: {
      averageRating: 5,
      reviewCount: 1,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
      fitSummary: {
        runsSmall: 0,
        trueToSize: 1,
        runsLarge: 0,
        total: 1,
        dominant: 'true_to_size',
      },
    },
    data: [review],
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthState.isAuthenticated = false;
  mockAuthState.user = null;
  mockAddItem.mockResolvedValue({ success: true });
  backInStockApi.createRequest.mockResolvedValue({
    success: true,
    message: 'Back-in-stock request saved',
  });
  mockBackendResponses();
});

test('loads product detail, reviews, fit guidance, and related products', async () => {
  renderDetail();

  expect(await screen.findByRole('heading', { name: 'Detail Runner' })).toBeInTheDocument();
  expect(productsApi.getById).toHaveBeenCalledWith(productId);
  await waitFor(() => {
    expect(recommendationsApi.getRecommendations).toHaveBeenCalledWith({ productId, limit: 4 });
  });
  expect(reviewsApi.getReviews).toHaveBeenCalledWith(productId, { limit: 20 });
  expect(screen.getByText('A breathable runner for long city walks.')).toBeInTheDocument();
  expect(screen.getByText('Fit confidence')).toBeInTheDocument();
  expect(screen.getByText('Runs true to size for most shoppers.')).toBeInTheDocument();
  expect(screen.getByText('Recycled knit')).toBeInTheDocument();
  expect(screen.getByText('Sustainability details')).toBeInTheDocument();
  expect(screen.getByText('Upper material includes supplier-documented recycled textile.')).toBeInTheDocument();
  expect(screen.getByText('Recycled upper textile')).toBeInTheDocument();
  expect(screen.getByText('Documented')).toBeInTheDocument();
  expect(screen.getByText('Portugal')).toBeInTheDocument();
  expect(screen.getByText('Care-tested for everyday city wear.')).toBeInTheDocument();
  expect(await screen.findByText('Great shoe')).toBeInTheDocument();
  expect(screen.getByText('Verified purchase')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'View Related Runner' })).toHaveAttribute(
    'href',
    '/products/507f1f77bcf86cd799439012'
  );
  expect(screen.getByText('Similar running styles')).toBeInTheDocument();
});

test('adds the selected product size to cart', async () => {
  renderDetail();

  await screen.findByRole('heading', { name: 'Detail Runner' });
  const sizeGroup = screen.getByRole('group', { name: /select size/i });
  fireEvent.click(within(sizeGroup).getByRole('button', { name: '42' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));

  await waitFor(() =>
    expect(mockAddItem).toHaveBeenCalledWith(
      {
        _id: productId,
        name: 'Detail Runner',
        image: '/images/detail-runner.jpg',
        price: { current: 120, original: 150 },
      },
      1,
      42
    )
  );
  expect(mockToastSuccess).toHaveBeenCalledWith('Detail Runner added to cart!');
  expect(mockOpenCart).toHaveBeenCalled();
});

test('shows distinct review submission failure states', async () => {
  mockAuthState.isAuthenticated = true;
  reviewsApi.createReview
    .mockRejectedValueOnce({ response: { status: 403 } })
    .mockRejectedValueOnce({ response: { status: 409 } });

  renderDetail();

  await screen.findByRole('heading', { name: 'Detail Runner' });
  fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Sizing note' } });
  fireEvent.change(screen.getByLabelText(/comment/i), {
    target: { value: 'Comfortable but I want to check the gate.' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Submit review' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Reviews are available after a verified purchase.'
  );

  fireEvent.click(screen.getByRole('button', { name: 'Submit review' }));

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(
      'You have already reviewed this product.'
    );
  });
});

test('submits back-in-stock intent for an unavailable backend product', async () => {
  productsApi.getById.mockResolvedValue({
    success: true,
    data: {
      ...backendProduct,
      stock: 0,
    },
  });

  renderDetail();

  expect(await screen.findByRole('heading', { name: 'Detail Runner' })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/^email$/i), {
    target: { value: 'customer@example.com' },
  });
  fireEvent.click(screen.getByLabelText(/email me about this product/i));
  fireEvent.click(screen.getByRole('button', { name: /notify me/i }));

  await waitFor(() => {
    expect(backInStockApi.createRequest).toHaveBeenCalledWith({
      productId,
      size: 41,
      email: 'customer@example.com',
      consent: true,
    });
  });
  expect(await screen.findByText('Back-in-stock request saved')).toBeInTheDocument();
});

test('renders a local fallback product without calling backend detail routes', async () => {
  loadFallbackCatalogProducts.mockResolvedValue({
    products: [
      {
        id: 'local-male-0',
        name: 'Fallback Runner',
        gender: 'male',
        category: 'Running',
        image: '/database/Male/0.webp',
        gallery: ['/database/Male/0.webp'],
        price: { original: 80, current: 60 },
        rating: 4,
        reviewCount: 0,
        sizes: [40, 41],
        stock: 10,
        description: '',
        materials: [],
        careInstructions: [],
        fitGuide: {},
        sustainability: {},
        fitSummary: {
          runsSmall: 0,
          trueToSize: 0,
          runsLarge: 0,
          total: 0,
          dominant: null,
        },
      },
      {
        id: 'local-male-1',
        name: 'Fallback Related',
        gender: 'male',
        category: 'Running',
        image: '/database/Male/1.webp',
        price: { original: 90, current: 90 },
        rating: 5,
        reviewCount: 0,
        sizes: [40, 41],
        stock: 10,
        materials: [],
        careInstructions: [],
        fitGuide: {},
        sustainability: {},
      },
    ],
  });

  renderDetail('/products/local-male-0');

  expect(await screen.findByRole('heading', { name: 'Fallback Runner' })).toBeInTheDocument();
  expect(productsApi.getById).not.toHaveBeenCalled();
  expect(reviewsApi.getReviews).not.toHaveBeenCalled();
  expect(screen.getByText('Runs true to size for most shoppers.')).toBeInTheDocument();
  expect(screen.getByText('Sustainability details are not available for this product yet.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'View Fallback Related' })).toHaveAttribute(
    'href',
    '/products/local-male-1'
  );
});
