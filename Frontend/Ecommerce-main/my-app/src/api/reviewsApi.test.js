import { vi } from 'vitest';
import api from './axios';
import { reviewsApi } from './reviewsApi';

vi.mock('./axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('getReviews calls the product reviews endpoint with params', async () => {
  const response = { success: true, data: [] };
  const params = { page: 2, limit: 5 };
  api.get.mockResolvedValue({ data: response });

  const result = await reviewsApi.getReviews('product-1', params);

  expect(api.get).toHaveBeenCalledWith('/products/product-1/reviews', { params });
  expect(result).toBe(response);
});

test('createReview posts review payload to the product reviews endpoint', async () => {
  const response = { success: true, data: { _id: 'review-1' } };
  const payload = {
    rating: 5,
    title: 'Great fit',
    comment: 'Comfortable all day.',
    fit: 'true_to_size',
  };
  api.post.mockResolvedValue({ data: response });

  const result = await reviewsApi.createReview('product-1', payload);

  expect(api.post).toHaveBeenCalledWith('/products/product-1/reviews', payload);
  expect(result).toBe(response);
});

