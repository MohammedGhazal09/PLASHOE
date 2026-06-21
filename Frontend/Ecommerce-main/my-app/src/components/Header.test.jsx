import { screen } from '@testing-library/react';
import { vi } from 'vitest';
import { config } from '../config/config';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { renderWithRouter } from '../test/routerTestUtils';
import Header from './Header';

vi.mock('../api/authApi', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

vi.mock('../api/cartApi', () => ({
  cartApi: {
    getCart: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
    applyCoupon: vi.fn(),
    removeCoupon: vi.fn(),
  },
}));

vi.mock('../api/wishlistApi', () => ({
  wishlistApi: {
    getWishlist: vi.fn(),
    addItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  config.features.wishlist = true;
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
  useCartStore.setState({
    items: [],
    couponCode: null,
    discount: 0,
    isLoading: false,
    error: null,
    isCartOpen: false,
  });
  useWishlistStore.setState({
    items: [
      { productId: 'local-1', name: 'One', price: { current: 10 }, source: 'local' },
      { productId: 'local-2', name: 'Two', price: { current: 20 }, source: 'local' },
    ],
    isLoading: false,
    error: null,
    lastMessage: null,
  });
});

afterEach(() => {
  config.features.wishlist = true;
});

test('shows wishlist link and count when the feature is enabled', () => {
  renderWithRouter(<Header />);

  const link = screen.getByRole('link', { name: /wishlist \(2 items\)/i });
  expect(link).toHaveAttribute('href', '/account');
});

test('omits wishlist link when the feature flag is disabled', () => {
  config.features.wishlist = false;

  renderWithRouter(<Header />);

  expect(screen.queryByRole('link', { name: /wishlist/i })).not.toBeInTheDocument();
});
