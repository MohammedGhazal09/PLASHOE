import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import toast from 'react-hot-toast';
import Account from './Account';
import { authApi } from '../api/authApi';
import { config } from '../config/config';
import { useAuthStore } from '../store/authStore';
import { normalizeCartItem, useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { renderWithRouter } from '../test/routerTestUtils';

const { mockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('../api/authApi', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
    addAddress: vi.fn(),
    setDefaultAddress: vi.fn(),
    deleteAddress: vi.fn(),
  },
}));

vi.mock('../api/ordersApi', () => ({
  ordersApi: {
    getAll: vi.fn(),
  },
}));

vi.mock('../api/wishlistApi', () => ({
  wishlistApi: {
    getWishlist: vi.fn().mockResolvedValue({ success: true, data: [] }),
    addItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

const wishlistItem = {
  productId: 'local-runner-1',
  name: 'Saved Runner',
  image: '/runner.jpg',
  price: { current: 99, original: 120 },
  sizes: [41, 42],
  stock: 5,
  category: 'Running',
  gender: 'male',
  addedAt: '2026-06-20T00:00:00.000Z',
  source: 'local',
};

const setAuthenticatedUser = (overrides = {}) => {
  useAuthStore.setState({
    user: { name: 'Test Buyer', email: 'buyer@example.com', ...overrides },
    token: 'token',
    isAuthenticated: true,
    isLoading: false,
    error: null,
  });
};

const resetStores = () => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
  mockNavigate.mockClear();
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
  authApi.getMe.mockResolvedValue({
    success: true,
    data: { name: 'Test Buyer', email: 'buyer@example.com', addresses: [] },
  });
  useWishlistStore.setState({
    items: [],
    isLoading: false,
    error: null,
    lastMessage: null,
  });
};

beforeEach(resetStores);

afterEach(() => {
  config.features.wishlist = true;
});

test('renders saved wishlist items in the account wishlist tab', async () => {
  setAuthenticatedUser();
  useWishlistStore.setState({
    items: [wishlistItem],
    syncWishlist: vi.fn().mockResolvedValue({ success: true }),
  });

  renderWithRouter(<Account />, {
    initialEntries: [{ pathname: '/account', state: { tab: 'wishlist' } }],
  });

  expect(await screen.findByRole('heading', { name: /my wishlist/i })).toBeInTheDocument();
  expect(screen.getByText('Saved Runner')).toBeInTheDocument();
  expect(screen.getByLabelText(/size for saved runner/i)).toHaveValue('41');
  expect(screen.getByRole('button', { name: /move to cart/i })).toHaveClass(
    'button-control--dark',
    'wishlist-move-button'
  );
});

test('shows wishlist load errors without hiding saved items', async () => {
  setAuthenticatedUser();
  useWishlistStore.setState({
    items: [wishlistItem],
    error: 'Failed to load wishlist',
    syncWishlist: vi.fn().mockResolvedValue({ success: false }),
  });

  renderWithRouter(<Account />, {
    initialEntries: [{ pathname: '/account', state: { tab: 'wishlist' } }],
  });

  expect(await screen.findByRole('alert')).toHaveTextContent(
    /we could not load your wishlist/i
  );
  expect(screen.getByText('Saved Runner')).toBeInTheDocument();
});

test('moves a saved wishlist item to cart before removing it', async () => {
  setAuthenticatedUser();
  const addItem = vi.fn().mockResolvedValue({ success: true });
  const removeItem = vi.fn().mockResolvedValue({ success: true });
  useCartStore.setState({ addItem });
  useWishlistStore.setState({
    items: [wishlistItem],
    removeItem,
    syncWishlist: vi.fn().mockResolvedValue({ success: true }),
  });

  renderWithRouter(<Account />, {
    initialEntries: [{ pathname: '/account', state: { tab: 'wishlist' } }],
  });

  fireEvent.click(await screen.findByRole('button', { name: /move to cart/i }));

  await waitFor(() => {
    expect(addItem).toHaveBeenCalledWith(
      {
        _id: 'local-runner-1',
        name: 'Saved Runner',
        image: '/runner.jpg',
        price: { current: 99, original: 120 },
      },
      1,
      41
    );
  });
  expect(removeItem).toHaveBeenCalledWith('local-runner-1');
});

test('keeps a wishlist item saved when move-to-cart fails', async () => {
  setAuthenticatedUser();
  const addItem = vi.fn().mockResolvedValue({ success: false, message: 'Out of stock' });
  const removeItem = vi.fn();
  useCartStore.setState({ addItem });
  useWishlistStore.setState({
    items: [wishlistItem],
    removeItem,
    syncWishlist: vi.fn().mockResolvedValue({ success: true }),
  });

  renderWithRouter(<Account />, {
    initialEntries: [{ pathname: '/account', state: { tab: 'wishlist' } }],
  });

  fireEvent.click(await screen.findByRole('button', { name: /move to cart/i }));

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('Out of stock');
  });
  expect(removeItem).not.toHaveBeenCalled();
});

test('triggers wishlist merge after successful login when local saves exist', async () => {
  const user = userEvent.setup();
  const mergeLocalWishlist = vi.fn().mockResolvedValue({ success: true, merged: 1 });
  useWishlistStore.setState({
    items: [wishlistItem],
    mergeLocalWishlist,
  });
  useAuthStore.setState({
    login: vi.fn().mockImplementation(async () => {
      setAuthenticatedUser();
      return { success: true };
    }),
  });

  const { container } = renderWithRouter(<Account />);

  await user.type(container.querySelector('input[name="email"]'), 'buyer@example.com');
  await user.type(container.querySelector('input[name="password"]'), 'password123');
  await user.click(screen.getByRole('button', { name: /sign in/i }));

  await waitFor(() => {
    expect(mergeLocalWishlist).toHaveBeenCalled();
  });
  expect(toast.success).toHaveBeenCalledWith('Wishlist saved to your account.');
});

test('returns checkout-intent shoppers to checkout after cart merge succeeds', async () => {
  const user = userEvent.setup();
  const mergeLocalCart = vi.fn().mockImplementation(async () => {
    setAuthenticatedUser();
    return { success: true, merged: 1, localOnly: 0 };
  });
  useCartStore.setState({
    items: [
      normalizeCartItem({
        _id: 'local-checkout-1',
        product: {
          _id: '64f000000000000000000001',
          name: 'Checkout Runner',
          image: '/runner.jpg',
          price: { current: 100, original: 120 },
        },
        quantity: 1,
        size: 42,
        priceAtAdd: 100,
        source: 'local',
      }),
    ],
    mergeLocalCart,
  });
  useAuthStore.setState({
    login: vi.fn().mockImplementation(async () => {
      setAuthenticatedUser();
      return { success: true };
    }),
  });

  const { container } = renderWithRouter(<Account />, {
    initialEntries: [{ pathname: '/account', state: { from: { pathname: '/checkout' } } }],
  });

  expect(screen.getByRole('status')).toHaveTextContent(/continue to secure checkout/i);

  await user.type(container.querySelector('input[name="email"]'), 'buyer@example.com');
  await user.type(container.querySelector('input[name="password"]'), 'password123');
  await user.click(screen.getByRole('button', { name: /sign in/i }));

  await waitFor(() => {
    expect(mergeLocalCart).toHaveBeenCalled();
  });
  expect(mockNavigate).toHaveBeenCalledWith('/checkout', { replace: true });
});

test('routes checkout-intent shoppers to cart review when merge fails', async () => {
  const user = userEvent.setup();
  const mergeLocalCart = vi.fn().mockResolvedValue({
    success: false,
    message: 'Some cart items need review before checkout',
  });
  useCartStore.setState({
    items: [
      normalizeCartItem({
        _id: 'local-conflict-1',
        product: {
          _id: '64f000000000000000000002',
          name: 'Conflict Runner',
          image: '/runner.jpg',
          price: { current: 100, original: 120 },
        },
        quantity: 4,
        size: 42,
        priceAtAdd: 100,
        source: 'local',
      }),
    ],
    mergeLocalCart,
  });
  useAuthStore.setState({
    login: vi.fn().mockImplementation(async () => {
      setAuthenticatedUser();
      return { success: true };
    }),
  });

  const { container } = renderWithRouter(<Account />, {
    initialEntries: [{ pathname: '/account', state: { from: { pathname: '/checkout' } } }],
  });

  await user.type(container.querySelector('input[name="email"]'), 'buyer@example.com');
  await user.type(container.querySelector('input[name="password"]'), 'password123');
  await user.click(screen.getByRole('button', { name: /sign in/i }));

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('/cart', {
      replace: true,
      state: { checkoutReview: 'Some cart items need review before checkout' },
    });
  });
});

test('updates profile details from the account settings tab', async () => {
  const user = userEvent.setup();
  setAuthenticatedUser({ _id: 'user-1', phone: '1112223333', addresses: [] });
  authApi.updateProfile.mockResolvedValue({
    success: true,
    data: {
      _id: 'user-1',
      name: 'Updated Buyer',
      email: 'buyer@example.com',
      phone: '5551234567',
      addresses: [],
    },
  });

  renderWithRouter(<Account />);

  await user.click(screen.getByRole('button', { name: /settings/i }));
  const profileForm = screen.getByRole('form', { name: /profile settings/i });
  const nameInput = within(profileForm).getByLabelText(/full name/i);
  const phoneInput = within(profileForm).getByLabelText(/^phone$/i);

  await user.clear(nameInput);
  await user.type(nameInput, 'Updated Buyer');
  await user.clear(phoneInput);
  await user.type(phoneInput, '5551234567');
  await user.click(within(profileForm).getByRole('button', { name: /save profile/i }));

  await waitFor(() => {
    expect(authApi.updateProfile).toHaveBeenCalledWith({
      name: 'Updated Buyer',
      phone: '5551234567',
    });
  });
  expect(toast.success).toHaveBeenCalledWith('Profile updated.');
});

test('adds a saved address from the account settings tab', async () => {
  const user = userEvent.setup();
  setAuthenticatedUser({ _id: 'user-1', phone: '5551234567', addresses: [] });
  const savedAddress = {
    _id: 'address-1',
    firstName: 'Test',
    lastName: 'Buyer',
    street: '123 Test Street',
    city: 'Testville',
    state: 'CA',
    zipCode: '90210',
    country: 'United States',
    phone: '5551234567',
    isDefault: true,
  };
  authApi.addAddress.mockResolvedValue({ success: true, data: [savedAddress] });

  renderWithRouter(<Account />, {
    initialEntries: [{ pathname: '/account', state: { tab: 'settings' } }],
  });

  const addressForm = screen.getByRole('form', { name: /add saved address/i });
  await user.type(within(addressForm).getByLabelText(/first name/i), 'Test');
  await user.type(within(addressForm).getByLabelText(/last name/i), 'Buyer');
  await user.clear(within(addressForm).getByLabelText(/country/i));
  await user.type(within(addressForm).getByLabelText(/country/i), 'United States');
  await user.type(within(addressForm).getByLabelText(/street address/i), '123 Test Street');
  await user.type(within(addressForm).getByLabelText(/^city$/i), 'Testville');
  await user.type(within(addressForm).getByLabelText(/^state$/i), 'CA');
  await user.type(within(addressForm).getByLabelText(/zip or postal code/i), '90210');
  await user.type(within(addressForm).getByLabelText(/delivery phone/i), '5551234567');
  await user.click(within(addressForm).getByRole('button', { name: /add address/i }));

  await waitFor(() => {
    expect(authApi.addAddress).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Test',
        lastName: 'Buyer',
        street: '123 Test Street',
        city: 'Testville',
        state: 'CA',
        zipCode: '90210',
        country: 'United States',
        phone: '5551234567',
        isDefault: true,
      })
    );
  });
  expect(await screen.findByText('123 Test Street')).toBeInTheDocument();
  expect(screen.getByText('Default')).toBeInTheDocument();
});

test('sets an existing saved address as the default from settings', async () => {
  const user = userEvent.setup();
  setAuthenticatedUser({
    _id: 'user-1',
    addresses: [
      {
        _id: 'address-1',
        firstName: 'Home',
        lastName: 'Buyer',
        street: '123 Test Street',
        city: 'Testville',
        state: 'CA',
        zipCode: '90210',
        country: 'United States',
        phone: '5551234567',
        isDefault: true,
      },
      {
        _id: 'address-2',
        firstName: 'Office',
        lastName: 'Buyer',
        street: '456 Work Street',
        city: 'Workville',
        state: 'NY',
        zipCode: '10001',
        country: 'United States',
        phone: '5559876543',
        isDefault: false,
      },
    ],
  });
  authApi.setDefaultAddress.mockResolvedValue({
    success: true,
    data: [
      { _id: 'address-1', firstName: 'Home', lastName: 'Buyer', isDefault: false },
      { _id: 'address-2', firstName: 'Office', lastName: 'Buyer', isDefault: true },
    ],
  });

  renderWithRouter(<Account />, {
    initialEntries: [{ pathname: '/account', state: { tab: 'settings' } }],
  });

  await user.click(
    screen.getByRole('button', { name: /set default address for office buyer/i })
  );

  await waitFor(() => {
    expect(authApi.setDefaultAddress).toHaveBeenCalledWith('address-2');
  });
  expect(toast.success).toHaveBeenCalledWith('Default address updated.');
});
