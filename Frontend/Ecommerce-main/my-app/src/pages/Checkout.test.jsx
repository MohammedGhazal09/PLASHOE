import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import { cartApi } from '../api/cartApi';
import { ordersApi } from '../api/ordersApi';
import { useAuthStore } from '../store/authStore';
import { normalizeCartItem, useCartStore } from '../store/cartStore';
import Checkout from './Checkout';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  return {
    __esModule: true,
    Link: ({ to, children, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useNavigate: () => mockNavigate,
  };
}, { virtual: true });

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../api/cartApi', () => ({
  cartApi: {
    getCart: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    clearCart: jest.fn(),
    applyCoupon: jest.fn(),
    removeCoupon: jest.fn(),
  },
}));

jest.mock('../api/ordersApi', () => ({
  ordersApi: {
    create: jest.fn(),
  },
}));

jest.mock('../api/authApi', () => ({
  authApi: {
    register: jest.fn(),
    login: jest.fn(),
    getMe: jest.fn(),
    updateProfile: jest.fn(),
    addAddress: jest.fn(),
    deleteAddress: jest.fn(),
  },
}));

const cartItem = {
  _id: 'cart-item-1',
  product: {
    _id: 'product-1',
    name: 'PLASHOE Runner',
    image: '/runner.jpg',
    price: { current: 100 },
  },
  quantity: 2,
  size: 42,
  priceAtAdd: 100,
};

const cartData = (overrides = {}) => ({
  items: [cartItem],
  couponCode: null,
  discount: 0,
  ...overrides,
});

const resetStores = ({ authenticated = true, cart = cartData() } = {}) => {
  localStorage.clear();
  jest.clearAllMocks();
  mockNavigate.mockClear();
  cartApi.getCart.mockResolvedValue({ success: true, data: cart });
  useAuthStore.setState({
    user: authenticated
      ? { name: 'Test Buyer', email: 'buyer@example.com', addresses: [] }
      : null,
    token: authenticated ? 'test-token' : null,
    isAuthenticated: authenticated,
    isLoading: false,
    error: null,
  });
  useCartStore.setState({
    items: cart.items.map(normalizeCartItem),
    couponCode: cart.couponCode,
    discount: cart.discount,
    isLoading: false,
    error: null,
    isCartOpen: false,
  });
};

const renderCheckout = async () => {
  const result = render(<Checkout />);

  await screen.findByRole('heading', { name: /checkout/i });
  return result;
};

const fillShippingForm = (container) => {
  userEvent.type(container.querySelector('input[name="phone"]'), '5551234567');
  userEvent.type(container.querySelector('input[name="address"]'), '123 Test Street');
  userEvent.type(container.querySelector('input[name="city"]'), 'Testville');
  userEvent.type(container.querySelector('input[name="state"]'), 'CA');
  userEvent.type(container.querySelector('input[name="zipCode"]'), '90210');
};

beforeEach(() => {
  resetStores();
});

test('applies a coupon, shows success, and clears the coupon input', async () => {
  cartApi.applyCoupon.mockResolvedValue({
    success: true,
    message: 'Coupon applied: 20% off',
    data: { couponCode: 'SAVE20', discount: 20 },
  });

  await renderCheckout();

  const couponInput = screen.getByPlaceholderText(/coupon code/i);
  userEvent.type(couponInput, 'save20');
  userEvent.click(screen.getByRole('button', { name: /apply/i }));

  await waitFor(() => {
    expect(toast.success).toHaveBeenCalledWith('Coupon applied! 20% off');
  });
  await waitFor(() => {
    expect(couponInput).toHaveValue('');
  });
});

test('preserves coupon input when coupon application fails', async () => {
  cartApi.applyCoupon.mockResolvedValue({
    success: false,
    message: 'Coupon not found',
  });

  await renderCheckout();

  const couponInput = screen.getByPlaceholderText(/coupon code/i);
  userEvent.type(couponInput, 'missing');
  userEvent.click(screen.getByRole('button', { name: /apply/i }));

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('Coupon not found');
  });
  expect(couponInput).toHaveValue('MISSING');
});

test('submits authenticated orders with shipping information', async () => {
  ordersApi.create.mockResolvedValue({ success: true });
  const { container } = await renderCheckout();

  fillShippingForm(container);
  userEvent.click(screen.getByRole('button', { name: /place order/i }));

  await waitFor(() => {
    expect(ordersApi.create).toHaveBeenCalledWith(
      {
        shippingAddress: {
          firstName: 'Test',
          lastName: 'Buyer',
          street: '123 Test Street',
          city: 'Testville',
          state: 'CA',
          zipCode: '90210',
          country: 'United States',
          phone: '5551234567',
        },
        notes: undefined,
      },
      expect.any(String)
    );
  });
  expect(toast.success).toHaveBeenCalledWith('Order placed successfully!');
  expect(cartApi.clearCart).toHaveBeenCalled();
});

test('keeps cart state and syncs after checkout conflict responses', async () => {
  ordersApi.create.mockRejectedValue({
    response: {
      status: 409,
      data: { message: 'Insufficient stock for one or more cart items' },
    },
  });
  const { container } = await renderCheckout();

  fillShippingForm(container);
  userEvent.click(screen.getByRole('button', { name: /place order/i }));

  await waitFor(() => {
  expect(toast.error).toHaveBeenCalledWith('Insufficient stock for one or more cart items');
  });
  expect(cartApi.clearCart).not.toHaveBeenCalled();
  expect(cartApi.getCart).toHaveBeenCalledTimes(3);
  expect(mockNavigate).not.toHaveBeenCalledWith('/account', { state: { tab: 'orders' } });
});

test('shows the empty-cart message without calling the order API', async () => {
  resetStores({ cart: cartData({ items: [] }) });

  render(
    <Checkout />
  );

  expect(await screen.findByRole('heading', { name: /your cart is empty/i })).toBeInTheDocument();
  expect(ordersApi.create).not.toHaveBeenCalled();
});

test('defensively redirects unauthenticated submit attempts to account', async () => {
  resetStores({ authenticated: false });
  const { container } = await renderCheckout();

  fillShippingForm(container);
  userEvent.click(screen.getByRole('button', { name: /place order/i }));

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('Please log in to checkout');
  });
  expect(ordersApi.create).not.toHaveBeenCalled();
  expect(mockNavigate).toHaveBeenCalledWith('/account', {
    state: { from: { pathname: '/checkout' } },
    replace: true,
  });
});
