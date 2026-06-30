import { vi } from 'vitest';
import api from './axios';
import { ordersApi } from './ordersApi';

vi.mock('./axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
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

test('getShippingOptions posts the selected country', async () => {
  api.post.mockResolvedValue({ data: { success: true, data: { methods: [] } } });

  const result = await ordersApi.getShippingOptions('Canada');

  expect(api.post).toHaveBeenCalledWith('/orders/shipping-options', { country: 'Canada' });
  expect(result).toEqual({ success: true, data: { methods: [] } });
});

test('getAll returns unwrapped order list response data', async () => {
  api.get.mockResolvedValue({ data: { success: true, data: [] } });

  const result = await ordersApi.getAll();

  expect(api.get).toHaveBeenCalledWith('/orders');
  expect(result).toEqual({ success: true, data: [] });
});

test('getById returns one unwrapped order response', async () => {
  api.get.mockResolvedValue({ data: { success: true, data: { _id: 'order-1' } } });

  const result = await ordersApi.getById('order-1');

  expect(api.get).toHaveBeenCalledWith('/orders/order-1');
  expect(result.data).toEqual({ _id: 'order-1' });
});

test('cancel returns unwrapped cancel response data', async () => {
  api.put.mockResolvedValue({ data: { success: true, data: { status: 'cancelled' } } });

  const result = await ordersApi.cancel('order-1');

  expect(api.put).toHaveBeenCalledWith('/orders/order-1/cancel');
  expect(result.data).toEqual({ status: 'cancelled' });
});

test('completeMockPayment posts the chosen sandbox outcome', async () => {
  api.post.mockResolvedValue({ data: { success: true, data: { paymentStatus: 'paid' } } });

  const result = await ordersApi.completeMockPayment('order-1', 'approve');

  expect(api.post).toHaveBeenCalledWith('/orders/order-1/payment/mock', { outcome: 'approve' });
  expect(result.data).toEqual({ paymentStatus: 'paid' });
});

test('capturePayPalPayment posts the PayPal return token', async () => {
  api.post.mockResolvedValue({ data: { success: true, data: { paymentStatus: 'paid' } } });

  const result = await ordersApi.capturePayPalPayment('order-1', 'paypal-token-1');

  expect(api.post).toHaveBeenCalledWith('/orders/order-1/payment/paypal/capture', {
    token: 'paypal-token-1',
  });
  expect(result.data).toEqual({ paymentStatus: 'paid' });
});

test('reorder posts to the order reorder endpoint', async () => {
  api.post.mockResolvedValue({ data: { success: true, data: { added: 1 } } });

  const result = await ordersApi.reorder('order-1');

  expect(api.post).toHaveBeenCalledWith('/orders/order-1/reorder');
  expect(result.data).toEqual({ added: 1 });
});
