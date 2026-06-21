import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { adminApi } from '../../api/adminApi';
import { renderWithRouter } from '../../test/routerTestUtils';
import AdminReturns from './AdminReturns';

vi.mock('../../api/adminApi', () => ({
  adminApi: {
    getReturns: vi.fn(),
    getReturn: vi.fn(),
    updateReturnStatus: vi.fn(),
  },
}));

const requestRow = {
  _id: 'rma-1',
  requestNumber: 'RMA-1001',
  orderNumber: 'PLS-1001',
  user: { email: 'customer@example.com' },
  type: 'return',
  status: 'requested',
  items: [{ orderItemId: 'item-1', name: 'Trail Runner', quantity: 1, reason: 'Too small' }],
  refundIntent: { requestedAmount: 99, status: 'manual_review_required' },
  createdAt: '2026-06-20T10:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  adminApi.getReturns.mockResolvedValue({
    success: true,
    data: [requestRow],
    total: 1,
    page: 1,
    pages: 1,
    limit: 20,
  });
  adminApi.getReturn.mockResolvedValue({
    success: true,
    data: {
      ...requestRow,
      statusHistory: [{ status: 'requested', actorRole: 'customer', timestamp: '2026-06-20T10:00:00.000Z' }],
    },
  });
  adminApi.updateReturnStatus.mockResolvedValue({
    success: true,
    message: 'Return request updated',
    data: { ...requestRow, status: 'approved', statusHistory: [] },
  });
});

test('renders the admin returns queue and applies filters', async () => {
  const user = userEvent.setup();
  renderWithRouter(<AdminReturns />);

  expect(await screen.findByText('RMA-1001')).toBeInTheDocument();

  await user.type(screen.getByLabelText(/search/i), 'PLS-1001');
  await user.selectOptions(screen.getByLabelText(/^status/i), 'requested');
  await user.click(screen.getByRole('button', { name: /apply filters/i }));

  await waitFor(() => {
    expect(adminApi.getReturns).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: 'PLS-1001', status: 'requested', page: 1, limit: 20 })
    );
  });
});

test('loads return detail and submits a status update', async () => {
  const user = userEvent.setup();
  renderWithRouter(<AdminReturns />);

  await user.click(await screen.findByRole('button', { name: /inspect/i }));
  expect(await screen.findByText(/trail runner x 1/i)).toBeInTheDocument();

  await user.selectOptions(screen.getByLabelText(/action/i), 'approved');
  await user.type(screen.getByLabelText(/note/i), 'Approved by support');
  await user.click(screen.getByRole('button', { name: /update return/i }));

  await waitFor(() => {
    expect(adminApi.updateReturnStatus).toHaveBeenCalledWith(
      'rma-1',
      expect.objectContaining({
        status: 'approved',
        note: expect.stringContaining('Approved by support'),
      })
    );
  });
});
