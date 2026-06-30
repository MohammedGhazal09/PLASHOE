import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { newsletterApi } from '../api/newsletterApi';
import { renderWithRouter } from '../test/routerTestUtils';
import Home from './Home';

vi.mock('../hooks/useCatalogProducts', () => ({
  useCatalogProducts: () => ({ products: [], loading: false }),
}));

vi.mock('../api/newsletterApi', () => ({
  newsletterApi: {
    subscribe: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  newsletterApi.subscribe.mockResolvedValue({
    success: true,
    message: 'Newsletter subscription saved',
    data: { email: 'subscriber@example.com', status: 'active' },
  });
});

test('submits newsletter email with explicit consent', async () => {
  const user = userEvent.setup();
  renderWithRouter(<Home />);

  await user.type(screen.getByRole('textbox', { name: /^email$/i }), 'subscriber@example.com');
  await user.click(screen.getByRole('checkbox', { name: /email me plashoe updates/i }));
  await user.click(screen.getByRole('button', { name: /subscribe/i }));

  await waitFor(() => {
    expect(newsletterApi.subscribe).toHaveBeenCalledWith({
      email: 'subscriber@example.com',
      consent: true,
      source: 'home_newsletter',
    });
  });
  expect(await screen.findByText(/newsletter subscription saved/i)).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: /^email$/i })).toHaveValue('');
});

test('requires newsletter consent before submitting', async () => {
  const user = userEvent.setup();
  renderWithRouter(<Home />);

  await user.type(screen.getByRole('textbox', { name: /^email$/i }), 'subscriber@example.com');
  await user.click(screen.getByRole('button', { name: /subscribe/i }));

  expect(await screen.findByText(/confirm newsletter consent/i)).toBeInTheDocument();
  expect(newsletterApi.subscribe).not.toHaveBeenCalled();
});

test('shows newsletter API errors in the form', async () => {
  const user = userEvent.setup();
  newsletterApi.subscribe.mockRejectedValue({
    response: { data: { message: 'Subscription service unavailable' } },
  });

  renderWithRouter(<Home />);

  await user.type(screen.getByRole('textbox', { name: /^email$/i }), 'subscriber@example.com');
  await user.click(screen.getByRole('checkbox', { name: /email me plashoe updates/i }));
  await user.click(screen.getByRole('button', { name: /subscribe/i }));

  expect(await screen.findByText(/subscription service unavailable/i)).toBeInTheDocument();
});
