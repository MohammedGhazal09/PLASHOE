import { vi } from 'vitest';
import api from './axios';
import { backInStockApi } from './backInStockApi';

vi.mock('./axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

test('createRequest posts explicit back-in-stock intent', async () => {
  const payload = {
    productId: 'product-1',
    size: 42,
    email: 'customer@example.com',
    consent: true,
  };
  api.post.mockResolvedValue({ data: { success: true } });

  const result = await backInStockApi.createRequest(payload);

  expect(api.post).toHaveBeenCalledWith('/back-in-stock', payload);
  expect(result).toEqual({ success: true });
});

