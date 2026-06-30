import { vi } from 'vitest';
import api from './axios';
import { newsletterApi } from './newsletterApi';

vi.mock('./axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('subscribe posts newsletter consent payload', async () => {
  const payload = {
    email: 'subscriber@example.com',
    consent: true,
    source: 'home_newsletter',
  };
  const response = { success: true, data: { status: 'active' } };
  api.post.mockResolvedValue({ data: response });

  const result = await newsletterApi.subscribe(payload);

  expect(api.post).toHaveBeenCalledWith('/newsletter', payload);
  expect(result).toBe(response);
});

test('unsubscribe posts the token endpoint', async () => {
  const response = { success: true, data: { status: 'unsubscribed' } };
  api.post.mockResolvedValue({ data: response });

  const result = await newsletterApi.unsubscribe('a'.repeat(64));

  expect(api.post).toHaveBeenCalledWith(`/newsletter/unsubscribe/${'a'.repeat(64)}`);
  expect(result).toBe(response);
});
