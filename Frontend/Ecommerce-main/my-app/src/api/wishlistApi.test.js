import { vi } from 'vitest';
import api from './axios';
import { wishlistApi } from './wishlistApi';

vi.mock('./axios', () => ({
  default: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('getWishlist calls the wishlist list endpoint with params', async () => {
  const response = { success: true, data: [] };
  const params = { page: 2, limit: 10 };
  api.get.mockResolvedValue({ data: response });

  const result = await wishlistApi.getWishlist(params);

  expect(api.get).toHaveBeenCalledWith('/wishlist', { params });
  expect(result).toBe(response);
});

test('addItem posts the product id payload', async () => {
  const response = { success: true, data: [] };
  api.post.mockResolvedValue({ data: response });

  const result = await wishlistApi.addItem('product-1');

  expect(api.post).toHaveBeenCalledWith('/wishlist/items', { productId: 'product-1' });
  expect(result).toBe(response);
});

test('removeItem deletes by product id', async () => {
  const response = { success: true, data: [] };
  api.delete.mockResolvedValue({ data: response });

  const result = await wishlistApi.removeItem('product-1');

  expect(api.delete).toHaveBeenCalledWith('/wishlist/items/product-1');
  expect(result).toBe(response);
});

