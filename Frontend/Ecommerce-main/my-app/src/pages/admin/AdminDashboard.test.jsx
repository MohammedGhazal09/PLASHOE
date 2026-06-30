import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { adminApi } from '../../api/adminApi';
import { renderWithRouter } from '../../test/routerTestUtils';
import AdminConsole from '../AdminConsole';
import AdminDashboard from './AdminDashboard';

vi.mock('../../api/adminApi', () => ({
  adminApi: {
    getSummary: vi.fn(),
  },
}));

const populatedSummary = {
  generatedAt: '2026-06-30T02:30:00.000Z',
  revenue: {
    paidTotal: 200,
    paidOrderCount: 2,
    averagePaidOrderValue: 100,
  },
  orders: {
    total: 3,
    byStatus: {
      processing: 1,
      shipped: 1,
      cancelled: 1,
    },
    paymentsByStatus: {
      paid: 2,
      payment_failed: 1,
    },
  },
  inventory: {
    productCount: 3,
    lowStockThreshold: 5,
    lowStockCount: 1,
    outOfStockCount: 1,
    lowStockProducts: [
      { _id: 'product-1', name: 'Low Stock Runner With Long Name', stock: 3 },
    ],
  },
  returns: {
    openCount: 2,
    byStatus: {
      requested: 1,
      approved: 1,
    },
  },
  messages: {
    unreadCount: 1,
  },
  coupons: {
    activeCount: 1,
    totalRedemptions: 7,
  },
};

const emptySummary = {
  generatedAt: '2026-06-30T02:30:00.000Z',
  revenue: { paidTotal: 0, paidOrderCount: 0, averagePaidOrderValue: 0 },
  orders: { total: 0, byStatus: {}, paymentsByStatus: {} },
  inventory: {
    productCount: 0,
    lowStockThreshold: 5,
    lowStockCount: 0,
    outOfStockCount: 0,
    lowStockProducts: [],
  },
  returns: { openCount: 0, byStatus: {} },
  messages: { unreadCount: 0 },
  coupons: { activeCount: 0, totalRedemptions: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
});

test('renders populated admin dashboard metrics', async () => {
  adminApi.getSummary.mockResolvedValue({ success: true, data: populatedSummary });

  renderWithRouter(<AdminDashboard />);

  expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  expect(screen.getByText('$200.00')).toBeInTheDocument();
  expect(screen.getByText(/2 paid orders/i)).toBeInTheDocument();
  expect(screen.getByText(/low stock runner with long name/i)).toBeInTheDocument();
  expect(screen.getByText(/3 left/i)).toBeInTheDocument();
  expect(screen.getByText(/redemptions/i)).toBeInTheDocument();
  expect(screen.getByText('7')).toBeInTheDocument();
});

test('renders an empty state when no dashboard activity exists', async () => {
  adminApi.getSummary.mockResolvedValue({ success: true, data: emptySummary });

  renderWithRouter(<AdminDashboard />);

  expect(await screen.findByText(/no store activity yet/i)).toBeInTheDocument();
  expect(screen.getByText('$0.00')).toBeInTheDocument();
  expect(screen.getByText(/no low-stock products need attention/i)).toBeInTheDocument();
});

test('shows dashboard errors and retries loading', async () => {
  const user = userEvent.setup();
  adminApi.getSummary
    .mockRejectedValueOnce(new Error('Network failed'))
    .mockResolvedValueOnce({ success: true, data: populatedSummary });

  renderWithRouter(<AdminDashboard />);

  expect(await screen.findByText(/dashboard unavailable/i)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /retry/i }));

  await waitFor(() => {
    expect(adminApi.getSummary).toHaveBeenCalledTimes(2);
  });
  expect(await screen.findByText('$200.00')).toBeInTheDocument();
});

test('admin console opens on the dashboard section', async () => {
  adminApi.getSummary.mockResolvedValue({ success: true, data: populatedSummary });

  renderWithRouter(<AdminConsole />);

  expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /dashboard/i })).toHaveAttribute('aria-current', 'page');
});
