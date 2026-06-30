import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { adminApi } from '../../api/adminApi';
import { renderWithRouter } from '../../test/routerTestUtils';
import AdminProductPicker from './AdminProductPicker';

vi.mock('../../api/adminApi', () => ({
  adminApi: {
    getProducts: vi.fn(),
  },
}));

const product = {
  _id: '64f000000000000000000021',
  name: 'City Runner',
  category: 'Running',
  stock: 3,
  price: { current: 99 },
};

beforeEach(() => {
  vi.clearAllMocks();
  adminApi.getProducts.mockResolvedValue({
    success: true,
    data: [product],
  });
});

test('searches and selects products with stock context', async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  renderWithRouter(<AdminProductPicker label="Hotspot product" onSelect={onSelect} />);

  expect(await screen.findByRole('button', { name: /select city runner/i })).toBeInTheDocument();
  expect(screen.getByText(/low stock: 3/i)).toBeInTheDocument();

  await user.clear(screen.getByRole('searchbox', { name: /search products/i }));
  await user.type(screen.getByRole('searchbox', { name: /search products/i }), 'city');
  await user.click(screen.getByRole('button', { name: /^search$/i }));

  await waitFor(() => {
    expect(adminApi.getProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: 'city', limit: 8, sort: 'newest' })
    );
  });

  await user.click(screen.getByRole('button', { name: /select city runner/i }));

  expect(onSelect).toHaveBeenCalledWith(product);
  expect(screen.getByText(/selected: city runner/i)).toBeInTheDocument();
});

test('renders no-results and stale selected states', async () => {
  adminApi.getProducts.mockResolvedValueOnce({ success: true, data: [] });

  renderWithRouter(
    <AdminProductPicker
      label="Bundle product"
      selectedProduct={{ _id: 'missing', name: 'Deleted product', isStale: true }}
    />
  );

  expect(await screen.findByText(/no products found/i)).toBeInTheDocument();
  expect(screen.getByText(/no longer in the catalog/i)).toBeInTheDocument();
});
