import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import { cartApi } from '../api/cartApi';
import { ordersApi } from '../api/ordersApi';
import { useAuthStore } from '../store/authStore';
import { normalizeCartItem, useCartStore } from '../store/cartStore';
import Checkout from './Checkout';

const { mockNavigate, assignMock, toastMock } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  assignMock: vi.fn(),
  toastMock: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('react-router-dom', () => {
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

vi.mock('react-hot-toast', () => ({
  default: toastMock,
  success: toastMock.success,
  error: toastMock.error,
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

vi.mock('../api/ordersApi', () => ({
  ordersApi: {
    create: vi.fn(),
  },
}));

vi.mock('../api/authApi', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
    addAddress: vi.fn(),
    deleteAddress: vi.fn(),
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
  vi.clearAllMocks();
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

const fillShippingForm = async (container, user) => {
  const typeIfBlank = async (selector, value) => {
    const input = container.querySelector(selector);
    if (!input.value) {
      await user.type(input, value);
    }
  };

  await typeIfBlank('input[name="firstName"]', 'Test');
  await typeIfBlank('input[name="lastName"]', 'Buyer');
  await typeIfBlank('input[name="email"]', 'buyer@example.com');
  await user.type(container.querySelector('input[name="phone"]'), '5551234567');
  await user.type(container.querySelector('input[name="address"]'), '123 Test Street');
  await user.type(container.querySelector('input[name="city"]'), 'Testville');
  await user.type(container.querySelector('input[name="state"]'), 'CA');
  await user.type(container.querySelector('input[name="zipCode"]'), '90210');
};

beforeEach(() => {
  resetStores();
  assignMock.mockClear();
});

beforeAll(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      assign: assignMock,
    },
  });
});

test('applies a coupon, shows success, and clears the coupon input', async () => {
  cartApi.applyCoupon.mockResolvedValue({
    success: true,
    message: 'Coupon applied: 20% off',
    data: { couponCode: 'SAVE20', discount: 20 },
  });

  await renderCheckout();

  const user = userEvent.setup();
  const couponInput = screen.getByPlaceholderText(/coupon code/i);
  await user.type(couponInput, 'save20');
  await user.click(screen.getByRole('button', { name: /apply/i }));

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

  const user = userEvent.setup();
  const couponInput = screen.getByPlaceholderText(/coupon code/i);
  await user.type(couponInput, 'missing');
  await user.click(screen.getByRole('button', { name: /apply/i }));

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('Coupon not found');
  });
  expect(couponInput).toHaveValue('MISSING');
});

test('submits authenticated checkout-start and redirects to hosted payment', async () => {
  ordersApi.create.mockResolvedValue({
    success: true,
    data: {
      payment: {
        checkoutUrl: 'https://checkout.example.test/pay/session-1',
      },
    },
  });
  const { container } = await renderCheckout();
  const user = userEvent.setup();

  await fillShippingForm(container, user);
  expect(screen.queryByText(new RegExp('no real payment will be ' + 'processed', 'i'))).not.toBeInTheDocument();
  expect(screen.queryByText(new RegExp('automatically ' + 'confirmed', 'i'))).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /continue to payment/i }));

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
  expect(assignMock).toHaveBeenCalledWith('https://checkout.example.test/pay/session-1');
  expect(toast.success).not.toHaveBeenCalled();
  expect(cartApi.clearCart).not.toHaveBeenCalled();
  expect(mockNavigate).not.toHaveBeenCalledWith('/account', { state: { tab: 'orders' } });
});

test('shows an error when checkout-start succeeds without a payment URL', async () => {
  ordersApi.create.mockResolvedValue({ success: true, data: { payment: {} } });
  const { container } = await renderCheckout();
  const user = userEvent.setup();

  await fillShippingForm(container, user);
  await user.click(screen.getByRole('button', { name: /continue to payment/i }));

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('Failed to start payment');
  });
  expect(assignMock).not.toHaveBeenCalled();
});

test('keeps cart state and syncs after checkout conflict responses', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  ordersApi.create.mockRejectedValue({
    response: {
      status: 409,
      data: { message: 'Insufficient stock for one or more cart items' },
    },
  });
  try {
    const { container } = await renderCheckout();
    const user = userEvent.setup();

    await fillShippingForm(container, user);
    await user.click(screen.getByRole('button', { name: /continue to payment/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Insufficient stock for one or more cart items');
    });
    expect(consoleError).toHaveBeenCalledWith('Checkout error:', expect.any(Object));
    expect(cartApi.clearCart).not.toHaveBeenCalled();
    expect(cartApi.getCart).toHaveBeenCalledTimes(3);
    expect(assignMock).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalledWith('/account', { state: { tab: 'orders' } });
  } finally {
    consoleError.mockRestore();
  }
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
  const user = userEvent.setup();

  await fillShippingForm(container, user);
  await user.click(screen.getByRole('button', { name: /continue to payment/i }));

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('Please log in to checkout');
  });
  expect(ordersApi.create).not.toHaveBeenCalled();
  expect(mockNavigate).toHaveBeenCalledWith('/account', {
    state: { from: { pathname: '/checkout' } },
    replace: true,
  });
});
