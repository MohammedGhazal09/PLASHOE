import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import { beforeEach, expect, test, vi } from 'vitest';
import { ordersApi } from '../api/ordersApi';
import { returnsApi } from '../api/returnsApi';
import { renderWithRouter } from '../test/routerTestUtils';
import OrderDetail from './OrderDetail';

const {
  mockSyncCart,
  mockOpenCart,
} = vi.hoisted(() => ({
  mockSyncCart: vi.fn(),
  mockOpenCart: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({ isAuthenticated: true }),
}));

vi.mock('../store/cartStore', () => ({
  useCartStore: (selector) => selector({
    syncCart: mockSyncCart,
    openCart: mockOpenCart,
  }),
}));

vi.mock('../api/ordersApi', () => ({
  ordersApi: {
    getById: vi.fn(),
    cancel: vi.fn(),
    reorder: vi.fn(),
  },
}));

vi.mock('../api/returnsApi', () => ({
  returnsApi: {
    getMine: vi.fn(),
    create: vi.fn(),
  },
}));

const deliveredOrder = {
  _id: 'order-1',
  orderNumber: 'PLS-1001',
  status: 'delivered',
  paymentStatus: 'paid',
  createdAt: '2026-06-01T10:00:00.000Z',
  deliveredAt: '2026-06-05T10:00:00.000Z',
  trackingHistory: [],
  items: [
    {
      _id: 'item-1',
      product: 'product-1',
      name: 'Trail Runner',
      image: '/database/Male/0.jpg',
      size: 42,
      quantity: 1,
      price: 99,
    },
  ],
  shippingAddress: {
    firstName: 'Test',
    lastName: 'Buyer',
    street: '123 Street',
    city: 'Riyadh',
    state: 'Riyadh',
    zipCode: '12345',
    country: 'Saudi Arabia',
    phone: '5550100',
  },
  subtotal: 99,
  discount: 0,
  total: 99,
};

const renderOrderDetail = () =>
  renderWithRouter(
    <Routes>
      <Route path="/order/:id" element={<OrderDetail />} />
      <Route path="/account" element={<div>Account page</div>} />
    </Routes>,
    { initialEntries: ['/order/order-1'] }
  );

beforeEach(() => {
  vi.clearAllMocks();
  ordersApi.getById.mockResolvedValue({ success: true, data: deliveredOrder });
  ordersApi.reorder.mockResolvedValue({
    success: true,
    data: { added: 1, skipped: [] },
  });
  mockSyncCart.mockResolvedValue({ success: true });
  returnsApi.getMine.mockResolvedValue({ success: true, data: [] });
  returnsApi.create.mockResolvedValue({ success: true, data: { _id: 'rma-1' } });
});

test('submits an eligible customer return request from order detail', async () => {
  const user = userEvent.setup();
  renderOrderDetail();

  expect(await screen.findByText('Returns & Exchanges')).toBeInTheDocument();
  await user.type(screen.getByLabelText(/reason/i), 'Too small');
  await user.click(screen.getByRole('button', { name: /submit return request/i }));

  await waitFor(() => {
    expect(returnsApi.create).toHaveBeenCalledWith({
      orderId: 'order-1',
      type: 'return',
      items: [
        {
          orderItemId: 'item-1',
          quantity: 1,
          reason: 'Too small',
        },
      ],
      customerNotes: undefined,
    });
  });
  expect(toast.success).toHaveBeenCalledWith('Return request submitted');
});

test('shows ineligible return policy copy for non-delivered orders', async () => {
  ordersApi.getById.mockResolvedValue({
    success: true,
    data: {
      ...deliveredOrder,
      status: 'processing',
      deliveredAt: null,
    },
  });

  renderOrderDetail();

  expect(await screen.findByText(/not currently eligible/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /submit return request/i })).not.toBeInTheDocument();
});

test('moves available order items back to cart', async () => {
  const user = userEvent.setup();
  renderOrderDetail();

  expect(await screen.findByText('Returns & Exchanges')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /buy again/i }));

  await waitFor(() => {
    expect(ordersApi.reorder).toHaveBeenCalledWith('order-1');
  });
  expect(mockSyncCart).toHaveBeenCalled();
  expect(mockOpenCart).toHaveBeenCalled();
  expect(toast.success).toHaveBeenCalledWith('1 item(s) moved to cart.');
});
