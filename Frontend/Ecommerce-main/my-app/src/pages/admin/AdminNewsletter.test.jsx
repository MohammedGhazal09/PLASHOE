import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { adminApi } from '../../api/adminApi';
import { renderWithRouter } from '../../test/routerTestUtils';
import AdminNewsletter from './AdminNewsletter';

vi.mock('../../api/adminApi', () => ({
  adminApi: {
    getNewsletterSummary: vi.fn(),
    getNewsletterSubscriptions: vi.fn(),
  },
}));

const summary = {
  totalCount: 3,
  activeCount: 2,
  statusCounts: {
    active: 2,
    unsubscribed: 1,
  },
  sourceCounts: [
    { source: 'home_newsletter', count: 2 },
    { source: 'footer', count: 1 },
  ],
};

const subscriptionRow = {
  _id: 'subscription-1',
  email: 'subscriber@example.com',
  status: 'active',
  source: 'home_newsletter',
  subscribedAt: '2026-06-29T10:00:00.000Z',
  unsubscribedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  adminApi.getNewsletterSummary.mockResolvedValue({ success: true, data: summary });
  adminApi.getNewsletterSubscriptions.mockResolvedValue({
    success: true,
    data: [subscriptionRow],
    total: 1,
    page: 1,
    pages: 1,
    limit: 20,
  });
});

test('renders newsletter summary and subscriptions without token fields', async () => {
  renderWithRouter(<AdminNewsletter />);

  expect(await screen.findByRole('heading', { name: /newsletter/i })).toBeInTheDocument();
  expect(screen.getByText(/active subscribers/i)).toBeInTheDocument();
  expect(screen.getByText(/active 2 \/ unsubscribed 1/i)).toBeInTheDocument();
  expect(screen.getByText('subscriber@example.com')).toBeInTheDocument();
  expect(screen.queryByText(/unsubscribeToken/i)).not.toBeInTheDocument();
});

test('applies newsletter filters', async () => {
  const user = userEvent.setup();
  renderWithRouter(<AdminNewsletter />);

  await screen.findByText('subscriber@example.com');
  await user.selectOptions(screen.getByLabelText(/^status/i), 'unsubscribed');
  await user.type(screen.getByLabelText(/^email/i), 'subscriber@example.com');
  await user.type(screen.getByLabelText(/^source/i), 'home_newsletter');
  await user.type(screen.getByLabelText(/^search/i), 'home');
  await user.click(screen.getByRole('button', { name: /apply filters/i }));

  await waitFor(() => {
    expect(adminApi.getNewsletterSubscriptions).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 20,
        status: 'unsubscribed',
        email: 'subscriber@example.com',
        source: 'home_newsletter',
        q: 'home',
      })
    );
  });
});

test('renders newsletter empty and error states', async () => {
  adminApi.getNewsletterSubscriptions.mockResolvedValueOnce({
    success: true,
    data: [],
    total: 0,
    page: 1,
    pages: 1,
    limit: 20,
  });

  renderWithRouter(<AdminNewsletter />);

  expect(await screen.findByText(/no newsletter subscriptions match these filters/i)).toBeInTheDocument();
});

test('renders newsletter load errors', async () => {
  adminApi.getNewsletterSubscriptions.mockRejectedValueOnce(new Error('Network failed'));

  renderWithRouter(<AdminNewsletter />);

  expect(await screen.findByText(/network failed/i)).toBeInTheDocument();
});
