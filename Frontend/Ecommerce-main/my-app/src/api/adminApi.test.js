import api from './axios';
import { adminApi } from './adminApi';

jest.mock('./axios', () => ({
  get: jest.fn(),
  patch: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('getOrders calls the admin order list endpoint with params', async () => {
  const response = { success: true, data: [] };
  const params = { page: 2, status: 'processing' };
  api.get.mockResolvedValue({ data: response });

  const result = await adminApi.getOrders(params);

  expect(api.get).toHaveBeenCalledWith('/admin/orders', { params });
  expect(result).toBe(response);
});

test('getOrder calls the admin order detail endpoint', async () => {
  const response = { success: true, data: { _id: 'order-1' } };
  api.get.mockResolvedValue({ data: response });

  const result = await adminApi.getOrder('order-1');

  expect(api.get).toHaveBeenCalledWith('/admin/orders/order-1');
  expect(result).toBe(response);
});

test('updateOrderFulfillment calls the fulfillment endpoint with payload', async () => {
  const response = { success: true, data: { status: 'shipped' } };
  const payload = {
    status: 'shipped',
    carrier: 'DHL',
    trackingNumber: 'TRACK123',
  };
  api.patch.mockResolvedValue({ data: response });

  const result = await adminApi.updateOrderFulfillment('order-1', payload);

  expect(api.patch).toHaveBeenCalledWith('/admin/orders/order-1/fulfillment', payload);
  expect(result).toBe(response);
});

test('getCoupons calls the existing admin coupon endpoint with params', async () => {
  const response = { success: true, data: [] };
  const params = { isActive: true, q: 'SAVE' };
  api.get.mockResolvedValue({ data: response });

  const result = await adminApi.getCoupons(params);

  expect(api.get).toHaveBeenCalledWith('/coupons', { params });
  expect(result).toBe(response);
});

test('getContactMessages calls the existing admin contact endpoint with params', async () => {
  const response = { success: true, data: [] };
  const params = { isRead: false, q: 'customer@example.com' };
  api.get.mockResolvedValue({ data: response });

  const result = await adminApi.getContactMessages(params);

  expect(api.get).toHaveBeenCalledWith('/contact', { params });
  expect(result).toBe(response);
});
