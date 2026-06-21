import { vi } from 'vitest';
import api from './axios';
import { returnsApi } from './returnsApi';

vi.mock('./axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('create posts a return request payload', async () => {
  const response = { success: true, data: { _id: 'rma-1' } };
  const payload = { orderId: 'order-1', type: 'return', items: [] };
  api.post.mockResolvedValue({ data: response });

  const result = await returnsApi.create(payload);

  expect(api.post).toHaveBeenCalledWith('/returns', payload);
  expect(result).toBe(response);
});

test('getMine calls the return list endpoint with params', async () => {
  const response = { success: true, data: [] };
  const params = { orderId: 'order-1' };
  api.get.mockResolvedValue({ data: response });

  const result = await returnsApi.getMine(params);

  expect(api.get).toHaveBeenCalledWith('/returns', { params });
  expect(result).toBe(response);
});

test('getById calls the return detail endpoint', async () => {
  const response = { success: true, data: { _id: 'rma-1' } };
  api.get.mockResolvedValue({ data: response });

  const result = await returnsApi.getById('rma-1');

  expect(api.get).toHaveBeenCalledWith('/returns/rma-1');
  expect(result).toBe(response);
});
