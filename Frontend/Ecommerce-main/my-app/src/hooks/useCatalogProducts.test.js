import { vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { loadCatalogProducts } from '../services/catalog/catalogService';
import { useCatalogProducts } from './useCatalogProducts';

vi.mock('../services/catalog/catalogService', () => ({
  loadCatalogProducts: vi.fn(),
}));

const pageOne = {
  products: [{ id: 'backend-1', name: 'Runner' }],
  pagination: { count: 1, total: 2, page: 1, limit: 1, pages: 2 },
  source: 'backend',
  error: null,
};

const pageTwo = {
  products: [{ id: 'backend-2', name: 'Walker' }],
  pagination: { count: 1, total: 2, page: 2, limit: 1, pages: 2 },
  source: 'backend',
  error: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

test('returns products, pagination, loading, error, source, and reload', async () => {
  loadCatalogProducts.mockResolvedValue(pageOne);

  const { result } = renderHook(() => useCatalogProducts({ gender: 'male', limit: 1 }));

  expect(result.current.loading).toBe(true);

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(loadCatalogProducts).toHaveBeenCalledWith({ gender: 'male', limit: 1 });
  expect(result.current.products).toEqual(pageOne.products);
  expect(result.current.pagination).toEqual(pageOne.pagination);
  expect(result.current.error).toBeNull();
  expect(result.current.source).toBe('backend');
  expect(result.current.reload).toEqual(expect.any(Function));
});

test('reload refreshes the current catalog params', async () => {
  loadCatalogProducts.mockResolvedValueOnce(pageOne).mockResolvedValueOnce(pageTwo);

  const { result } = renderHook(() => useCatalogProducts({ page: 1, limit: 1 }));

  await waitFor(() => expect(result.current.products).toEqual(pageOne.products));

  await act(async () => {
    await result.current.reload();
  });

  expect(loadCatalogProducts).toHaveBeenLastCalledWith({ page: 1, limit: 1 });
  expect(result.current.products).toEqual(pageTwo.products);
  expect(result.current.pagination).toEqual(pageTwo.pagination);
});
