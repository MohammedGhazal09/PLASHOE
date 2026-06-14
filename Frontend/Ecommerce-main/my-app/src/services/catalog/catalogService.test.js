import { beforeEach, expect, test, vi } from 'vitest';
import { productsApi } from '../../api/productsApi';
import { loadCatalogProducts } from './catalogService';

vi.mock('../../api/productsApi', () => ({
  productsApi: {
    getAll: vi.fn(),
  },
}));

const fallbackDatabase = {
  female: [
    {
      name: 'Female Full Price',
      img: '/database/Female/0.jpg',
      price: { old: '$80.00', new: '$80.00' },
      rating: 4,
      category: 'Sneaker',
    },
    {
      name: 'Female Sale',
      img: '/database/Female/1.jpg',
      price: { old: '$100.00', new: '$70.00' },
      rating: 5,
      category: 'Running',
    },
  ],
  male: [
    {
      name: 'Male Sale',
      img: '/database/Male/0.jpg',
      price: { old: '$90.00', new: '$60.00' },
      rating: 3,
      category: 'Training',
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => fallbackDatabase,
  });
});

test('loads backend products through productsApi.getAll and normalizes the envelope', async () => {
  productsApi.getAll.mockResolvedValue({
    success: true,
    count: 1,
    total: 1,
    page: 2,
    limit: 1,
    pages: 1,
    data: [
      {
        _id: 'backend-1',
        name: 'Backend Runner',
        gender: 'male',
        category: 'Running',
        image: '/images/runner.jpg',
        price: { original: 140, current: 120 },
      },
    ],
  });

  const result = await loadCatalogProducts({ category: 'all', sort: 'default', page: 2, limit: 1 });

  expect(productsApi.getAll).toHaveBeenCalledWith({ page: 2, limit: 1 });
  expect(global.fetch).not.toHaveBeenCalled();
  expect(result).toMatchObject({
    source: 'backend',
    pagination: { count: 1, total: 1, page: 2, limit: 1, pages: 1 },
  });
  expect(result.products[0]).toMatchObject({
    id: 'backend-1',
    image: '/images/runner.jpg',
    price: { original: 140, current: 120 },
    source: 'backend',
  });
});

test('treats valid empty backend responses as authoritative', async () => {
  productsApi.getAll.mockResolvedValue({
    success: true,
    count: 0,
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
    data: [],
  });

  const result = await loadCatalogProducts({ sale: 'true' });

  expect(result).toMatchObject({
    source: 'backend',
    products: [],
    pagination: { count: 0, total: 0, page: 1, limit: 20, pages: 0 },
  });
  expect(global.fetch).not.toHaveBeenCalled();
});

test('loads and filters static fallback products only when the backend request throws', async () => {
  productsApi.getAll.mockRejectedValue(new Error('network'));

  const result = await loadCatalogProducts({ sale: 'true', sort: 'price-asc', limit: 10 });

  expect(global.fetch).toHaveBeenCalledWith('/database/database.json');
  expect(result.source).toBe('fallback');
  expect(result.error).toEqual(expect.any(Error));
  expect(result.pagination).toMatchObject({ count: 2, total: 2, page: 1, limit: 10, pages: 1 });
  expect(result.products.map((product) => product.id)).toEqual(['local-sale-1', 'local-sale-0']);
  expect(result.products.every((product) => product.isOnSale)).toBe(true);
});

test('loads static fallback products from a non-root Vite base URL', async () => {
  vi.stubEnv('BASE_URL', '/storefront/');
  productsApi.getAll.mockRejectedValue(new Error('network'));

  await loadCatalogProducts({ sale: 'true', limit: 10 });

  expect(global.fetch).toHaveBeenCalledWith('/storefront/database/database.json');
});

test('returns an empty fallback result when static fallback loading also fails', async () => {
  productsApi.getAll.mockRejectedValue(new Error('network'));
  global.fetch.mockResolvedValue({ ok: false });

  const result = await loadCatalogProducts({ gender: 'female', page: 3, limit: 5 });

  expect(result).toMatchObject({
    products: [],
    source: 'fallback',
    pagination: { count: 0, total: 0, page: 3, limit: 5, pages: 0 },
  });
  expect(result.error).toEqual(expect.any(Error));
});
