import { beforeEach, expect, test, vi } from 'vitest';
import api from '../api/axios';
import { resetServerWarmupForTests, warmUpApiServer } from './serverWarmup';

vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  resetServerWarmupForTests();
});

test('warms the API server once through the health endpoint', async () => {
  api.get.mockResolvedValue({ data: { status: 'ok' } });

  await warmUpApiServer();
  await warmUpApiServer();

  expect(api.get).toHaveBeenCalledTimes(1);
  expect(api.get).toHaveBeenCalledWith('/health');
});

test('swallows warm-up failures so page loading can continue', async () => {
  api.get.mockRejectedValue(new Error('network unavailable'));

  await expect(warmUpApiServer()).resolves.toBeUndefined();
});
