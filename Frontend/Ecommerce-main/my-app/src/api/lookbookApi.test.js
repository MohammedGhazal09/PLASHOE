import { vi } from 'vitest';
import api from './axios';
import { lookbookApi } from './lookbookApi';

vi.mock('./axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('getEntries calls the public lookbook endpoint', async () => {
  const response = { success: true, data: [] };
  api.get.mockResolvedValue({ data: response });

  const result = await lookbookApi.getEntries();

  expect(api.get).toHaveBeenCalledWith('/lookbook');
  expect(result).toBe(response);
});

