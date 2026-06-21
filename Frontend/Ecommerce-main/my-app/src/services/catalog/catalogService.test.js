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

test('applies catalog filters and sort to backend data defensively', async () => {
  productsApi.getAll.mockResolvedValue({
    success: true,
    count: 4,
    total: 4,
    page: 1,
    limit: 20,
    pages: 1,
    data: [
      {
        _id: 'high-runner',
        name: 'High Male Runner',
        gender: 'male',
        category: 'Running',
        image: '/images/high-runner.jpg',
        price: { original: 180, current: 160 },
      },
      {
        _id: 'training-shoe',
        name: 'Male Trainer',
        gender: 'male',
        category: 'Training',
        image: '/images/trainer.jpg',
        price: { original: 90, current: 90 },
      },
      {
        _id: 'female-runner',
        name: 'Female Runner',
        gender: 'female',
        category: 'Running',
        image: '/images/female-runner.jpg',
        price: { original: 130, current: 90 },
      },
      {
        _id: 'low-runner',
        name: 'Low Male Runner',
        gender: 'male',
        category: 'Running',
        image: '/images/low-runner.jpg',
        price: { original: 120, current: 80 },
      },
    ],
  });

  const result = await loadCatalogProducts({
    gender: 'male',
    category: 'Running',
    sort: 'price-asc',
  });

  expect(productsApi.getAll).toHaveBeenCalledWith({
    gender: 'male',
    category: 'Running',
    sort: 'price-asc',
    page: 1,
    limit: 20,
  });
  expect(result.products.map((product) => product.name)).toEqual([
    'Low Male Runner',
    'High Male Runner',
  ]);
  expect(result.pagination).toMatchObject({ count: 2, total: 2, page: 1, limit: 20, pages: 1 });
});

test('passes and defensively applies advanced discovery params', async () => {
  productsApi.getAll.mockResolvedValue({
    success: true,
    count: 3,
    total: 3,
    page: 1,
    limit: 20,
    pages: 1,
    data: [
      {
        _id: 'trail-runner',
        name: 'Trail Runner',
        gender: 'male',
        category: 'Running',
        description: 'Trail traction shoe',
        sizes: [41, 42],
        rating: 4.8,
        isOnSale: true,
        image: '/images/trail-runner.jpg',
        price: { original: 150, current: 110 },
      },
      {
        _id: 'road-runner',
        name: 'Road Runner',
        gender: 'male',
        category: 'Running',
        description: 'Road shoe',
        sizes: [43],
        rating: 4.9,
        isOnSale: true,
        image: '/images/road-runner.jpg',
        price: { original: 140, current: 120 },
      },
      {
        _id: 'trail-classic',
        name: 'Trail Classic',
        gender: 'male',
        category: 'Classic',
        description: 'Trail inspired classic',
        sizes: [41],
        rating: 3.8,
        isOnSale: true,
        image: '/images/trail-classic.jpg',
        price: { original: 100, current: 90 },
      },
    ],
  });

  const result = await loadCatalogProducts({
    q: ' trail ',
    size: '41',
    minPrice: '100',
    maxPrice: '115',
    minRating: '4',
    sale: 'true',
  });

  expect(productsApi.getAll).toHaveBeenCalledWith({
    q: 'trail',
    size: '41',
    minPrice: '100',
    maxPrice: '115',
    minRating: '4',
    sale: 'true',
    page: 1,
    limit: 20,
  });
  expect(result.products.map((product) => product.name)).toEqual(['Trail Runner']);
  expect(result.pagination).toMatchObject({ count: 1, total: 1, page: 1, limit: 20, pages: 1 });
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
