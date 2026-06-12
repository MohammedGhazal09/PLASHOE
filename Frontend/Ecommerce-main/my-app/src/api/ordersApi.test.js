import api from './axios';
import { ordersApi } from './ordersApi';

jest.mock('./axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
}));

test('create sends an Idempotency-Key header when provided', async () => {
  api.post.mockResolvedValue({ data: { success: true } });
  const orderData = { shippingAddress: { firstName: 'Test' } };

  await ordersApi.create(orderData, 'checkout-key-1');

  expect(api.post).toHaveBeenCalledWith('/orders', orderData, {
    headers: { 'Idempotency-Key': 'checkout-key-1' },
  });
});

test('create keeps the existing request shape when no key is provided', async () => {
  api.post.mockResolvedValue({ data: { success: true } });
  const orderData = { shippingAddress: { firstName: 'Test' } };

  await ordersApi.create(orderData);

  expect(api.post).toHaveBeenCalledWith('/orders', orderData, undefined);
});
