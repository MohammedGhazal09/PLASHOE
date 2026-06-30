import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { adminApi } from '../../api/adminApi';
import { renderWithRouter } from '../../test/routerTestUtils';
import AdminBackInStock from './AdminBackInStock';

vi.mock('../../api/adminApi', () => ({
  adminApi: {
    getBackInStockSummary: vi.fn(),
    getBackInStockRequests: vi.fn(),
    updateBackInStockStatus: vi.fn(),
  },
}));

const summary = {
  totalCount: 3,
  pendingCount: 2,
  statusCounts: {
    pending: 2,
    notified: 1,
  },
  pendingBySize: [{ size: 42, count: 2 }],
  topDemand: [
    {
      product: { _id: 'product-1', name: 'Trail Demand Runner', stock: 0 },
      size: 42,
      pendingCount: 2,
      emailCount: 2,
    },
  ],
};

const requestRow = {
  _id: 'request-1',
  product: { _id: 'product-1', name: 'Trail Demand Runner', stock: 0 },
  size: 42,
  email: 'alpha@example.com',
  status: 'pending',
  requestedAt: '2026-06-29T10:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  adminApi.getBackInStockSummary.mockResolvedValue({ success: true, data: summary });
  adminApi.getBackInStockRequests.mockResolvedValue({
    success: true,
    data: [requestRow],
    total: 1,
    page: 1,
    pages: 1,
    limit: 20,
  });
  adminApi.updateBackInStockStatus.mockResolvedValue({
    success: true,
    message: 'Back-in-stock request marked notified',
    data: { ...requestRow, status: 'notified', notifiedAt: '2026-06-30T10:00:00.000Z' },
  });
});

test('renders back-in-stock summary and request rows', async () => {
  renderWithRouter(<AdminBackInStock />);

  expect(await screen.findByRole('heading', { name: /back-in-stock/i })).toBeInTheDocument();
  expect(screen.getAllByText(/pending demand/i).length).toBeGreaterThan(0);
  expect(screen.getByText(/2 pending requests/i)).toBeInTheDocument();
  expect(screen.getByText(/pending 2 \/ notified 1/i)).toBeInTheDocument();
  expect(screen.getAllByText(/trail demand runner/i).length).toBeGreaterThan(0);
  expect(screen.getByText('alpha@example.com')).toBeInTheDocument();
});

test('applies back-in-stock filters', async () => {
  const user = userEvent.setup();
  renderWithRouter(<AdminBackInStock />);

  await screen.findByText('alpha@example.com');
  await user.selectOptions(screen.getByLabelText(/^status/i), 'notified');
  await user.type(screen.getByLabelText(/^email/i), 'alpha@example.com');
  await user.type(screen.getByLabelText(/product id/i), '507f1f77bcf86cd799439011');
  await user.type(screen.getByLabelText(/^size/i), '42');
  await user.type(screen.getByLabelText(/^search/i), 'Trail');
  await user.click(screen.getByRole('button', { name: /apply filters/i }));

  await waitFor(() => {
    expect(adminApi.getBackInStockRequests).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 20,
        status: 'notified',
        email: 'alpha@example.com',
        productId: '507f1f77bcf86cd799439011',
        size: '42',
        q: 'Trail',
      })
    );
  });
});

test('marks a request notified and refreshes demand', async () => {
  const user = userEvent.setup();
  renderWithRouter(<AdminBackInStock />);

  await user.click(await screen.findByRole('button', { name: /mark notified/i }));

  await waitFor(() => {
    expect(adminApi.updateBackInStockStatus).toHaveBeenCalledWith('request-1', {
      status: 'notified',
    });
  });
  expect(await screen.findByText(/request marked notified/i)).toBeInTheDocument();
  expect(adminApi.getBackInStockSummary).toHaveBeenCalledTimes(2);
});

test('renders an empty state', async () => {
  adminApi.getBackInStockRequests.mockResolvedValueOnce({
    success: true,
    data: [],
    total: 0,
    page: 1,
    pages: 1,
    limit: 20,
  });

  renderWithRouter(<AdminBackInStock />);

  expect(await screen.findByText(/no back-in-stock requests match these filters/i)).toBeInTheDocument();
});

test('renders load errors', async () => {
  adminApi.getBackInStockRequests.mockRejectedValueOnce(new Error('Network failed'));

  renderWithRouter(<AdminBackInStock />);

  expect(await screen.findByText(/network failed/i)).toBeInTheDocument();
});
