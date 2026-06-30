import { vi } from 'vitest';
import api from './axios';
import { adminApi } from './adminApi';

vi.mock('./axios', () => ({
  default: {
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('getProducts calls the product list endpoint with params', async () => {
  const response = { success: true, data: [] };
  const params = { page: 1, category: 'Running' };
  api.get.mockResolvedValue({ data: response });

  const result = await adminApi.getProducts(params);

  expect(api.get).toHaveBeenCalledWith('/products', { params });
  expect(result).toBe(response);
});

test('getSummary calls the admin summary endpoint', async () => {
  const response = { success: true, data: { orders: { total: 0 } } };
  api.get.mockResolvedValue({ data: response });

  const result = await adminApi.getSummary();

  expect(api.get).toHaveBeenCalledWith('/admin/summary');
  expect(result).toBe(response);
});

test('back-in-stock admin wrappers call retention endpoints', async () => {
  const response = { success: true, data: [] };
  const params = { status: 'pending', size: 42, email: 'customer@example.com' };
  api.get.mockResolvedValue({ data: response });
  api.patch.mockResolvedValue({ data: response });

  await expect(adminApi.getBackInStockSummary()).resolves.toBe(response);
  expect(api.get).toHaveBeenCalledWith('/back-in-stock/admin/summary');

  await expect(adminApi.getBackInStockRequests(params)).resolves.toBe(response);
  expect(api.get).toHaveBeenCalledWith('/back-in-stock/admin', { params });

  await expect(adminApi.updateBackInStockStatus('request-1', { status: 'notified' })).resolves.toBe(response);
  expect(api.patch).toHaveBeenCalledWith('/back-in-stock/admin/request-1/status', {
    status: 'notified',
  });
});

test('newsletter admin wrappers call subscription endpoints', async () => {
  const response = { success: true, data: [] };
  const params = { status: 'active', source: 'home_newsletter' };
  api.get.mockResolvedValue({ data: response });

  await expect(adminApi.getNewsletterSummary()).resolves.toBe(response);
  expect(api.get).toHaveBeenCalledWith('/newsletter/admin/summary');

  await expect(adminApi.getNewsletterSubscriptions(params)).resolves.toBe(response);
  expect(api.get).toHaveBeenCalledWith('/newsletter/admin', { params });
});

test('review moderation wrappers call admin review endpoints', async () => {
  const response = { success: true, data: [] };
  const params = { isApproved: false, productId: 'product-1' };
  api.get.mockResolvedValue({ data: response });
  api.patch.mockResolvedValue({ data: response });

  await expect(adminApi.getAdminReviews(params)).resolves.toBe(response);
  expect(api.get).toHaveBeenCalledWith('/admin/reviews', { params });

  await expect(adminApi.getAdminReview('review-1')).resolves.toBe(response);
  expect(api.get).toHaveBeenCalledWith('/admin/reviews/review-1');

  await expect(adminApi.updateReviewModeration('review-1', { isApproved: true })).resolves.toBe(response);
  expect(api.patch).toHaveBeenCalledWith('/admin/reviews/review-1/moderation', {
    isApproved: true,
  });
});

test('createProduct calls the product create endpoint with payload', async () => {
  const response = { success: true, data: { _id: 'product-1' } };
  const payload = {
    name: 'Trail Runner',
    gender: 'male',
    category: 'Running',
    image: '/images/trail.jpg',
    price: { original: 120, current: 99 },
  };
  api.post.mockResolvedValue({ data: response });

  const result = await adminApi.createProduct(payload);

  expect(api.post).toHaveBeenCalledWith('/products', payload);
  expect(result).toBe(response);
});

test('updateProduct calls the product update endpoint with payload', async () => {
  const response = { success: true, data: { _id: 'product-1' } };
  const payload = { stock: 12 };
  api.put.mockResolvedValue({ data: response });

  const result = await adminApi.updateProduct('product-1', payload);

  expect(api.put).toHaveBeenCalledWith('/products/product-1', payload);
  expect(result).toBe(response);
});

test('deleteProduct calls the product delete endpoint', async () => {
  const response = { success: true, message: 'Product deleted' };
  api.delete.mockResolvedValue({ data: response });

  const result = await adminApi.deleteProduct('product-1');

  expect(api.delete).toHaveBeenCalledWith('/products/product-1');
  expect(result).toBe(response);
});

test('admin lookbook wrappers call lookbook endpoints', async () => {
  const response = { success: true, data: [] };
  const payload = { title: 'Scene', image: '/images/scene.jpg' };
  api.get.mockResolvedValue({ data: response });
  api.post.mockResolvedValue({ data: response });
  api.put.mockResolvedValue({ data: response });
  api.delete.mockResolvedValue({ data: response });

  await expect(adminApi.getLookbookEntries()).resolves.toBe(response);
  expect(api.get).toHaveBeenCalledWith('/admin/lookbook');

  await expect(adminApi.createLookbookEntry(payload)).resolves.toBe(response);
  expect(api.post).toHaveBeenCalledWith('/admin/lookbook', payload);

  await expect(adminApi.updateLookbookEntry('entry-1', payload)).resolves.toBe(response);
  expect(api.put).toHaveBeenCalledWith('/admin/lookbook/entry-1', payload);

  await expect(adminApi.deleteLookbookEntry('entry-1')).resolves.toBe(response);
  expect(api.delete).toHaveBeenCalledWith('/admin/lookbook/entry-1');
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

test('getReturns calls the admin returns endpoint with params', async () => {
  const response = { success: true, data: [] };
  const params = { page: 1, status: 'requested' };
  api.get.mockResolvedValue({ data: response });

  const result = await adminApi.getReturns(params);

  expect(api.get).toHaveBeenCalledWith('/admin/returns', { params });
  expect(result).toBe(response);
});

test('getReturn calls the admin return detail endpoint', async () => {
  const response = { success: true, data: { _id: 'rma-1' } };
  api.get.mockResolvedValue({ data: response });

  const result = await adminApi.getReturn('rma-1');

  expect(api.get).toHaveBeenCalledWith('/admin/returns/rma-1');
  expect(result).toBe(response);
});

test('updateReturnStatus calls the admin return status endpoint with payload', async () => {
  const response = { success: true, data: { status: 'approved' } };
  const payload = { status: 'approved', note: 'Approved' };
  api.patch.mockResolvedValue({ data: response });

  const result = await adminApi.updateReturnStatus('rma-1', payload);

  expect(api.patch).toHaveBeenCalledWith('/admin/returns/rma-1/status', payload);
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

test('createCoupon calls the coupon create endpoint with payload', async () => {
  const response = { success: true, data: { _id: 'coupon-1' } };
  const payload = { code: 'SAVE10', discountPercentage: 10, isActive: true };
  api.post.mockResolvedValue({ data: response });

  const result = await adminApi.createCoupon(payload);

  expect(api.post).toHaveBeenCalledWith('/coupons', payload);
  expect(result).toBe(response);
});

test('deleteCoupon calls the coupon delete endpoint', async () => {
  const response = { success: true, message: 'Coupon deleted' };
  api.delete.mockResolvedValue({ data: response });

  const result = await adminApi.deleteCoupon('coupon-1');

  expect(api.delete).toHaveBeenCalledWith('/coupons/coupon-1');
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

test('markContactMessageRead calls the contact mark-read endpoint', async () => {
  const response = { success: true, data: { _id: 'message-1', isRead: true } };
  api.put.mockResolvedValue({ data: response });

  const result = await adminApi.markContactMessageRead('message-1');

  expect(api.put).toHaveBeenCalledWith('/contact/message-1/read');
  expect(result).toBe(response);
});

test('deleteContactMessage calls the contact delete endpoint', async () => {
  const response = { success: true, message: 'Message deleted' };
  api.delete.mockResolvedValue({ data: response });

  const result = await adminApi.deleteContactMessage('message-1');

  expect(api.delete).toHaveBeenCalledWith('/contact/message-1');
  expect(result).toBe(response);
});
