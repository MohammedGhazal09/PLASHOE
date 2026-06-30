import { Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { ordersApi } from '../api/ordersApi';
import { TestMemoryRouter } from '../test/routerTestUtils';
import CheckoutMockPayment from './CheckoutMockPayment';

vi.mock('../api/ordersApi', () => ({
  ordersApi: {
    getById: vi.fn(),
    completeMockPayment: vi.fn(),
  },
}));

const mockOrder = {
  _id: 'order-1',
  orderNumber: 'PLS-MOCK-1001',
  total: 112,
  paymentProvider: 'mock',
  paymentStatus: 'payment_pending',
};

const renderMockPayment = (path = '/checkout/mock?orderId=order-1') =>
  render(
    <TestMemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/checkout/mock" element={<CheckoutMockPayment />} />
        <Route path="/checkout/success" element={<h1>Success return</h1>} />
        <Route path="/checkout/cancel" element={<h1>Cancel return</h1>} />
      </Routes>
    </TestMemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  ordersApi.getById.mockResolvedValue({ success: true, data: mockOrder });
  ordersApi.completeMockPayment.mockResolvedValue({
    success: true,
    data: { ...mockOrder, paymentStatus: 'paid' },
  });
});

test('shows sandbox payment context and records an approved outcome', async () => {
  const user = userEvent.setup();
  renderMockPayment();

  expect(await screen.findByRole('heading', { name: /mock checkout gateway/i })).toBeInTheDocument();
  expect(screen.getByText(/no real money is processed/i)).toBeInTheDocument();
  expect(screen.getByText('PLS-MOCK-1001')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /approve/i }));

  await waitFor(() => {
    expect(ordersApi.completeMockPayment).toHaveBeenCalledWith('order-1', 'approve');
  });
  expect(await screen.findByRole('heading', { name: /success return/i })).toBeInTheDocument();
});

test('routes canceled mock outcomes to the cancel return page', async () => {
  const user = userEvent.setup();
  renderMockPayment();

  await user.click(await screen.findByRole('button', { name: /cancel/i }));

  await waitFor(() => {
    expect(ordersApi.completeMockPayment).toHaveBeenCalledWith('order-1', 'cancel');
  });
  expect(await screen.findByRole('heading', { name: /cancel return/i })).toBeInTheDocument();
});

test('disables outcomes when the order is not in mock payment mode', async () => {
  ordersApi.getById.mockResolvedValueOnce({
    success: true,
    data: { ...mockOrder, paymentProvider: 'stripe' },
  });

  renderMockPayment();

  expect(await screen.findByText(/not in mock payment mode/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /approve/i })).toBeDisabled();
  expect(ordersApi.completeMockPayment).not.toHaveBeenCalled();
});
