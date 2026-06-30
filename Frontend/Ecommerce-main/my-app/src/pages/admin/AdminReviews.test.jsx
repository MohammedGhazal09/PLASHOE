import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { adminApi } from '../../api/adminApi';
import { renderWithRouter } from '../../test/routerTestUtils';
import AdminReviews from './AdminReviews';

vi.mock('../../api/adminApi', () => ({
  adminApi: {
    getAdminReviews: vi.fn(),
    getAdminReview: vi.fn(),
    updateReviewModeration: vi.fn(),
  },
}));

const approvedReview = {
  _id: 'review-1',
  title: 'Clean daily shoe',
  comment: 'The fit was reliable.',
  rating: 4,
  fit: 'true_to_size',
  isApproved: true,
  verifiedPurchase: true,
  createdAt: '2026-06-29T10:00:00.000Z',
  product: { _id: 'product-1', name: 'City Runner' },
  user: { name: 'Buyer', email: 'buyer@example.com' },
};

beforeEach(() => {
  vi.clearAllMocks();
  adminApi.getAdminReviews.mockResolvedValue({
    success: true,
    data: [approvedReview],
    total: 1,
    page: 1,
    pages: 1,
    limit: 20,
  });
  adminApi.getAdminReview.mockResolvedValue({
    success: true,
    data: approvedReview,
  });
  adminApi.updateReviewModeration.mockResolvedValue({
    success: true,
    message: 'Review hidden',
    data: { ...approvedReview, isApproved: false },
    summary: { averageRating: 0, reviewCount: 0 },
  });
});

test('renders review moderation rows and applies filters', async () => {
  const user = userEvent.setup();
  renderWithRouter(<AdminReviews />);

  expect(await screen.findByText(/clean daily shoe/i)).toBeInTheDocument();

  await user.selectOptions(screen.getByLabelText(/approval/i), 'false');
  await user.type(screen.getByLabelText(/product id/i), '507f1f77bcf86cd799439011');
  await user.type(screen.getByLabelText(/^search/i), 'fit');
  await user.click(screen.getByRole('button', { name: /apply filters/i }));

  await waitFor(() => {
    expect(adminApi.getAdminReviews).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 20,
        isApproved: 'false',
        productId: '507f1f77bcf86cd799439011',
        q: 'fit',
      })
    );
  });
});

test('loads review detail and hides an approved review', async () => {
  const user = userEvent.setup();
  renderWithRouter(<AdminReviews />);

  await user.click(await screen.findByRole('button', { name: /inspect/i }));
  expect(await screen.findByText(/true to size/i)).toBeInTheDocument();

  await user.click(screen.getAllByRole('button', { name: /hide/i })[0]);

  await waitFor(() => {
    expect(adminApi.updateReviewModeration).toHaveBeenCalledWith('review-1', {
      isApproved: false,
    });
  });
  expect(await screen.findByText(/review hidden/i)).toBeInTheDocument();
});

test('renders review empty and error states', async () => {
  adminApi.getAdminReviews.mockResolvedValueOnce({
    success: true,
    data: [],
    total: 0,
    page: 1,
    pages: 1,
    limit: 20,
  });

  renderWithRouter(<AdminReviews />);

  expect(await screen.findByText(/no reviews match these filters/i)).toBeInTheDocument();
});

test('renders review load errors', async () => {
  adminApi.getAdminReviews.mockRejectedValueOnce(new Error('Network failed'));

  renderWithRouter(<AdminReviews />);

  expect(await screen.findByText(/network failed/i)).toBeInTheDocument();
});
