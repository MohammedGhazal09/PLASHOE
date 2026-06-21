import { vi } from 'vitest';
import api from './axios';
import { productsApi } from './productsApi';

vi.mock('./axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('getAll calls the product list endpoint with catalog discovery params', async () => {
  const response = { success: true, data: [] };
  const params = {
    q: 'trail',
    category: 'Running',
    size: 41,
    minPrice: 80,
    maxPrice: 140,
    minRating: 4,
    sale: 'true',
    sort: 'price-asc',
    page: 2,
    limit: 12,
  };
  api.get.mockResolvedValue({ data: response });

  const result = await productsApi.getAll(params);

  expect(api.get).toHaveBeenCalledWith('/products', { params });
  expect(result).toBe(response);
});

test('getRelated calls the related products endpoint with params', async () => {
  const response = { success: true, data: [] };
  const params = { limit: 4 };
  api.get.mockResolvedValue({ data: response });

  const result = await productsApi.getRelated('product-1', params);

  expect(api.get).toHaveBeenCalledWith('/products/product-1/related', { params });
  expect(result).toBe(response);
});
