import api from './axios';
import { contactApi } from './contactApi';

jest.mock('./axios', () => ({
  post: jest.fn(),
}));

test('submit posts contact fields and returns unwrapped response data', async () => {
  api.post.mockResolvedValue({ data: { success: true, message: 'sent' } });

  const result = await contactApi.submit(
    'Contact User',
    'contact@example.com',
    'Sizing',
    'Do you ship to Riyadh?'
  );

  expect(api.post).toHaveBeenCalledWith('/contact', {
    name: 'Contact User',
    email: 'contact@example.com',
    subject: 'Sizing',
    message: 'Do you ship to Riyadh?',
  });
  expect(result).toEqual({ success: true, message: 'sent' });
});
