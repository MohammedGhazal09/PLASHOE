import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ordersApi } from '../api/ordersApi';
import { TestMemoryRouter } from '../test/routerTestUtils';
import CheckoutReturn from './CheckoutReturn';

vi.mock('../api/ordersApi', () => ({
  ordersApi: {
    getById: vi.fn(),
    capturePayPalPayment: vi.fn(),
  },
}));

const renderReturnPage = (path, variant = 'success') =>
  render(
    <TestMemoryRouter initialEntries={[path]}>
      <CheckoutReturn variant={variant} />
    </TestMemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
});

test('refetches the order before showing paid success state', async () => {
  ordersApi.getById.mockResolvedValue({
    success: true,
    data: {
      _id: 'order-1',
      orderNumber: 'PLS-PAID',
      paymentStatus: 'paid',
    },
  });

  renderReturnPage('/checkout/success?orderId=order-1&session_id=session-1');

  await waitFor(() => {
    expect(ordersApi.getById).toHaveBeenCalledWith('order-1');
  });
  expect(await screen.findByRole('heading', { name: /payment status/i })).toBeInTheDocument();
  expect(screen.getByText('Paid')).toBeInTheDocument();
  expect(screen.getByText(/order #pls-paid/i)).toBeInTheDocument();
});

test('shows cancel return with pending payment state from fetched order', async () => {
  ordersApi.getById.mockResolvedValue({
    success: true,
    data: {
      _id: 'order-2',
      orderNumber: 'PLS-PENDING',
      paymentStatus: 'payment_pending',
    },
  });

  renderReturnPage('/checkout/cancel?orderId=order-2&session_id=session-2', 'cancel');

  expect(await screen.findByRole('heading', { name: /checkout canceled/i })).toBeInTheDocument();
  expect(screen.getByText('Payment pending')).toBeInTheDocument();
});

test('shows sandbox outcome notice for mock payment returns', async () => {
  ordersApi.getById.mockResolvedValue({
    success: true,
    data: {
      _id: 'order-mock',
      orderNumber: 'PLS-MOCK',
      paymentStatus: 'paid',
    },
  });

  renderReturnPage('/checkout/success?orderId=order-mock&mock=approve');

  expect(await screen.findByText(/sandbox outcome recorded/i)).toBeInTheDocument();
  expect(screen.getByText(/no real money was processed/i)).toBeInTheDocument();
});

test('captures PayPal sandbox approval before showing paid state', async () => {
  ordersApi.getById.mockResolvedValue({
    success: true,
    data: {
      _id: 'order-paypal',
      orderNumber: 'PLS-PAYPAL',
      paymentProvider: 'paypal',
      paymentProviderSessionId: 'paypal-order-1',
      paymentStatus: 'payment_pending',
    },
  });
  ordersApi.capturePayPalPayment.mockResolvedValue({
    success: true,
    data: {
      _id: 'order-paypal',
      orderNumber: 'PLS-PAYPAL',
      paymentProvider: 'paypal',
      paymentStatus: 'paid',
    },
  });

  renderReturnPage('/checkout/success?orderId=order-paypal&token=paypal-order-1');

  await waitFor(() => {
    expect(ordersApi.capturePayPalPayment).toHaveBeenCalledWith('order-paypal', 'paypal-order-1');
  });
  expect(await screen.findByText('Paid')).toBeInTheDocument();
  expect(screen.getByText(/paypal sandbox approval was captured/i)).toBeInTheDocument();
});

test('shows PayPal capture failure without hiding the fetched order', async () => {
  ordersApi.getById.mockResolvedValue({
    success: true,
    data: {
      _id: 'order-paypal-failed',
      orderNumber: 'PLS-PAYPAL-PENDING',
      paymentProvider: 'paypal',
      paymentProviderSessionId: 'paypal-order-2',
      paymentStatus: 'payment_pending',
    },
  });
  ordersApi.capturePayPalPayment.mockRejectedValue({
    response: {
      data: { message: 'PayPal payment has not been completed yet' },
    },
  });

  renderReturnPage('/checkout/success?orderId=order-paypal-failed&token=paypal-order-2');

  expect(await screen.findByText('Payment pending')).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent(
    'PayPal payment has not been completed yet'
  );
});

test('renders failed and canceled payment labels from authoritative order state', async () => {
  ordersApi.getById.mockResolvedValueOnce({
    success: true,
    data: {
      _id: 'order-3',
      paymentStatus: 'payment_failed',
    },
  });
  const { unmount } = renderReturnPage('/checkout/success?orderId=order-3');

  expect(await screen.findByText('Payment failed')).toBeInTheDocument();
  unmount();

  ordersApi.getById.mockResolvedValueOnce({
    success: true,
    data: {
      _id: 'order-4',
      paymentStatus: 'payment_canceled',
    },
  });
  renderReturnPage('/checkout/cancel?orderId=order-4', 'cancel');

  expect(await screen.findByText('Payment canceled')).toBeInTheDocument();
});

test('shows recovery actions when orderId is missing', async () => {
  renderReturnPage('/checkout/success');

  expect(screen.getByRole('heading', { name: /order status unavailable/i })).toBeInTheDocument();
  expect(ordersApi.getById).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: /view orders/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /shop collection/i })).toBeInTheDocument();
});

test('shows recovery actions when refetch fails', async () => {
  ordersApi.getById.mockRejectedValue(new Error('network'));

  renderReturnPage('/checkout/success?orderId=order-5');

  expect(await screen.findByRole('heading', { name: /order status unavailable/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /view orders/i })).toBeInTheDocument();
});
