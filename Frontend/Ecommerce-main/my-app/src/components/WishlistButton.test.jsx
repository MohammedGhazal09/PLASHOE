import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import toast from 'react-hot-toast';
import { config } from '../config/config';
import WishlistButton from './WishlistButton';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';

vi.mock('../api/authApi', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

vi.mock('../api/wishlistApi', () => ({
  wishlistApi: {
    getWishlist: vi.fn(),
    addItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  success: vi.fn(),
  error: vi.fn(),
}));

const product = {
  id: 'local-runner-1',
  name: 'Local Runner',
  image: '/runner.jpg',
  price: { current: 100, original: 120 },
  sizes: [41],
};

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
  useWishlistStore.setState({
    items: [],
    isLoading: false,
    error: null,
    lastMessage: null,
  });
});

afterEach(() => {
  config.features.wishlist = true;
});

test('renders an accessible unsaved wishlist button', () => {
  render(<WishlistButton product={product} />);

  const button = screen.getByRole('button', { name: /save local runner to wishlist/i });
  expect(button).toHaveAttribute('aria-pressed', 'false');
});

test('toggles local wishlist state and updates the accessible label', async () => {
  render(<WishlistButton product={product} showText />);

  fireEvent.click(screen.getByRole('button', { name: /save local runner to wishlist/i }));

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /remove local runner from wishlist/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
  expect(useWishlistStore.getState().isSaved(product.id)).toBe(true);
  expect(toast.success).toHaveBeenCalled();

  await act(async () => {
    await useWishlistStore.getState().removeItem(product.id);
  });
});
