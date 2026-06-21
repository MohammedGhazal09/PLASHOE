import { beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { warmUpApiServer } from './services/serverWarmup';
import { useAuthStore } from './store/authStore';

vi.mock('./api/authApi', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
    addAddress: vi.fn(),
    deleteAddress: vi.fn(),
  },
}));

vi.mock('./api/cartApi', () => ({
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

vi.mock('./services/serverWarmup', () => ({
  warmUpApiServer: vi.fn(),
}));

vi.mock('./pages', () => ({
  Home: () => <section>Featured PLASHOE storefront</section>,
  Men: () => <section>Men page</section>,
  Women: () => <section>Women page</section>,
  Collection: () => <section>Collection page</section>,
  Sale: () => <section>Sale page</section>,
  Cart: () => <section>Cart page</section>,
  Checkout: () => <section>Checkout page</section>,
  CheckoutReturn: () => <section>Checkout return page</section>,
  Account: () => <section>Account page</section>,
  AdminConsole: () => <section>Admin console page</section>,
  Contact: () => <section>Contact page</section>,
  LookBook: () => <section>Lookbook page</section>,
  OurStory: () => <section>Our story page</section>,
  OrderDetail: () => <section>Order detail page</section>,
  ProductDetail: () => <section>Product detail page</section>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  window.history.pushState({}, '', '/');
  useAuthStore.setState({
    isAuthenticated: false,
    token: null,
    user: null,
  });
});

test('renders the PLASHOE storefront shell', () => {
  render(<App />);

  expect(screen.getByAltText(/plashoe/i)).toBeInTheDocument();
  expect(screen.getByText(/express shipping/i)).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: /^men$/i }).length).toBeGreaterThan(0);
  expect(screen.getByText(/featured plashoe storefront/i)).toBeInTheDocument();
});

test('starts the API warm-up when the app mounts', async () => {
  render(<App />);

  await waitFor(() => {
    expect(warmUpApiServer).toHaveBeenCalledTimes(1);
  });
});

test('omits the storefront footer on the admin route', () => {
  window.history.pushState({}, '', '/admin');
  useAuthStore.setState({
    isAuthenticated: true,
    token: 'admin-token',
    user: { isAdmin: true },
  });

  render(<App />);

  expect(screen.getByText(/admin console page/i)).toBeInTheDocument();
  expect(screen.queryByText(/better for people & the planet/i)).not.toBeInTheDocument();
});
