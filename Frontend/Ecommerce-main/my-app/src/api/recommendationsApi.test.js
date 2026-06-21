import { vi } from 'vitest';
import api from './axios';
import { recommendationsApi } from './recommendationsApi';

vi.mock('./axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

test('getRecommendations calls the bounded recommendations endpoint', async () => {
  const response = { success: true, data: [] };
  const params = { productId: 'product-1', limit: 4 };
  api.get.mockResolvedValue({ data: response });

  const result = await recommendationsApi.getRecommendations(params);

  expect(api.get).toHaveBeenCalledWith('/recommendations', { params });
  expect(result).toBe(response);
});

