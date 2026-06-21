import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { adminApi } from '../../api/adminApi';
import { renderWithRouter } from '../../test/routerTestUtils';
import AdminOrders from './AdminOrders';

vi.mock('../../api/adminApi', () => ({
  adminApi: {
    getOrders: vi.fn(),
    getOrder: vi.fn(),
    updateOrderFulfillment: vi.fn(),
  },
}));

const orderRow = {
  _id: 'order-1',
  orderNumber: 'PLS-1001',
  user: { email: 'customer@example.com' },
  status: 'processing',
  paymentStatus: 'paid',
  total: 159,
  itemCount: 2,
  createdAt: '2026-06-20T10:00:00.000Z',
};

const orderDetail = {
  ...orderRow,
  items: [{ _id: 'item-1', name: 'Trail Runner', quantity: 1 }],
  shippingAddress: { address: '1 Main Street', city: 'Riyadh' },
};

beforeEach(() => {
  vi.clearAllMocks();
  adminApi.getOrders.mockResolvedValue({
    success: true,
    data: [orderRow],
    total: 1,
    page: 1,
    pages: 1,
    limit: 20,
  });
  adminApi.getOrder.mockResolvedValue({ success: true, data: orderDetail });
  adminApi.updateOrderFulfillment.mockResolvedValue({
    success: true,
    message: 'Fulfillment updated',
    data: { ...orderDetail, status: 'shipped' },
  });
});

test('renders the admin order list and applies filters', async () => {
  const user = userEvent.setup();
  renderWithRouter(<AdminOrders />);

  expect(await screen.findByText('PLS-1001')).toBeInTheDocument();

  await user.type(screen.getByLabelText(/search/i), 'customer@example.com');
  await user.click(screen.getByRole('button', { name: /apply filters/i }));

  await waitFor(() => {
    expect(adminApi.getOrders).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: 'customer@example.com', page: 1, limit: 20 })
    );
  });
});

test('loads order detail and submits a fulfillment update', async () => {
  const user = userEvent.setup();
  renderWithRouter(<AdminOrders />);

  await user.click(await screen.findByRole('button', { name: /inspect/i }));
  expect(await screen.findByText(/trail runner/i)).toBeInTheDocument();

  await user.selectOptions(screen.getByLabelText(/fulfillment status/i), 'shipped');
  await user.type(screen.getByLabelText(/carrier/i), 'DHL');
  await user.type(screen.getByLabelText(/tracking number/i), 'TRACK123');
  await user.click(screen.getByRole('button', { name: /update fulfillment/i }));

  await waitFor(() => {
    expect(adminApi.updateOrderFulfillment).toHaveBeenCalledWith(
      'order-1',
      expect.objectContaining({
        status: 'shipped',
        carrier: expect.stringContaining('DHL'),
        trackingNumber: expect.stringContaining('TRACK123'),
      })
    );
  });
});
