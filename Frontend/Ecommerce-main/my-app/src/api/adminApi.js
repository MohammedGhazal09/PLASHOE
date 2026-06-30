import api from './axios';
import {
  createAdminDemoRestrictionError,
  getAdminDemoResponse,
} from './adminDemoData';

let adminDemoMode = false;

const getDemoRead = (name, ...args) =>
  adminDemoMode ? getAdminDemoResponse(name, ...args) : null;

const assertWritable = () => {
  if (adminDemoMode) {
    throw createAdminDemoRestrictionError();
  }
};

export const adminApi = {
  setDemoMode: (enabled) => {
    adminDemoMode = Boolean(enabled);
  },

  isDemoMode: () => adminDemoMode,

  getSummary: async () => {
    const demo = getDemoRead('getSummary');
    if (demo) return demo;

    const { data } = await api.get('/admin/summary');
    return data;
  },

  getBackInStockSummary: async () => {
    const demo = getDemoRead('getBackInStockSummary');
    if (demo) return demo;

    const { data } = await api.get('/back-in-stock/admin/summary');
    return data;
  },

  getBackInStockRequests: async (params) => {
    const demo = getDemoRead('getBackInStockRequests', params);
    if (demo) return demo;

    const { data } = await api.get('/back-in-stock/admin', { params });
    return data;
  },

  updateBackInStockStatus: async (id, payload) => {
    assertWritable();

    const { data } = await api.patch(`/back-in-stock/admin/${id}/status`, payload);
    return data;
  },

  getNewsletterSummary: async () => {
    const demo = getDemoRead('getNewsletterSummary');
    if (demo) return demo;

    const { data } = await api.get('/newsletter/admin/summary');
    return data;
  },

  getNewsletterSubscriptions: async (params) => {
    const demo = getDemoRead('getNewsletterSubscriptions', params);
    if (demo) return demo;

    const { data } = await api.get('/newsletter/admin', { params });
    return data;
  },

  getAdminReviews: async (params) => {
    const demo = getDemoRead('getAdminReviews', params);
    if (demo) return demo;

    const { data } = await api.get('/admin/reviews', { params });
    return data;
  },

  getAdminReview: async (id) => {
    const demo = getDemoRead('getAdminReview', id);
    if (demo) return demo;

    const { data } = await api.get(`/admin/reviews/${id}`);
    return data;
  },

  updateReviewModeration: async (id, payload) => {
    assertWritable();

    const { data } = await api.patch(`/admin/reviews/${id}/moderation`, payload);
    return data;
  },

  getProducts: async (params) => {
    const demo = getDemoRead('getProducts', params);
    if (demo) return demo;

    const { data } = await api.get('/products', { params });
    return data;
  },

  createProduct: async (payload) => {
    assertWritable();

    const { data } = await api.post('/products', payload);
    return data;
  },

  updateProduct: async (id, payload) => {
    assertWritable();

    const { data } = await api.put(`/products/${id}`, payload);
    return data;
  },

  deleteProduct: async (id) => {
    assertWritable();

    const { data } = await api.delete(`/products/${id}`);
    return data;
  },

  getLookbookEntries: async () => {
    const demo = getDemoRead('getLookbookEntries');
    if (demo) return demo;

    const { data } = await api.get('/admin/lookbook');
    return data;
  },

  createLookbookEntry: async (payload) => {
    assertWritable();

    const { data } = await api.post('/admin/lookbook', payload);
    return data;
  },

  updateLookbookEntry: async (id, payload) => {
    assertWritable();

    const { data } = await api.put(`/admin/lookbook/${id}`, payload);
    return data;
  },

  deleteLookbookEntry: async (id) => {
    assertWritable();

    const { data } = await api.delete(`/admin/lookbook/${id}`);
    return data;
  },

  getOrders: async (params) => {
    const demo = getDemoRead('getOrders', params);
    if (demo) return demo;

    const { data } = await api.get('/admin/orders', { params });
    return data;
  },

  getOrder: async (id) => {
    const demo = getDemoRead('getOrder', id);
    if (demo) return demo;

    const { data } = await api.get(`/admin/orders/${id}`);
    return data;
  },

  updateOrderFulfillment: async (id, payload) => {
    assertWritable();

    const { data } = await api.patch(`/admin/orders/${id}/fulfillment`, payload);
    return data;
  },

  getReturns: async (params) => {
    const demo = getDemoRead('getReturns', params);
    if (demo) return demo;

    const { data } = await api.get('/admin/returns', { params });
    return data;
  },

  getReturn: async (id) => {
    const demo = getDemoRead('getReturn', id);
    if (demo) return demo;

    const { data } = await api.get(`/admin/returns/${id}`);
    return data;
  },

  updateReturnStatus: async (id, payload) => {
    assertWritable();

    const { data } = await api.patch(`/admin/returns/${id}/status`, payload);
    return data;
  },

  getCoupons: async (params) => {
    const demo = getDemoRead('getCoupons', params);
    if (demo) return demo;

    const { data } = await api.get('/coupons', { params });
    return data;
  },

  createCoupon: async (payload) => {
    assertWritable();

    const { data } = await api.post('/coupons', payload);
    return data;
  },

  deleteCoupon: async (id) => {
    assertWritable();

    const { data } = await api.delete(`/coupons/${id}`);
    return data;
  },

  getContactMessages: async (params) => {
    const demo = getDemoRead('getContactMessages', params);
    if (demo) return demo;

    const { data } = await api.get('/contact', { params });
    return data;
  },

  markContactMessageRead: async (id) => {
    assertWritable();

    const { data } = await api.put(`/contact/${id}/read`);
    return data;
  },

  deleteContactMessage: async (id) => {
    assertWritable();

    const { data } = await api.delete(`/contact/${id}`);
    return data;
  },
};
