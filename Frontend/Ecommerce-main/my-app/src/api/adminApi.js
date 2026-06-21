import api from './axios';

export const adminApi = {
  getProducts: async (params) => {
    const { data } = await api.get('/products', { params });
    return data;
  },

  createProduct: async (payload) => {
    const { data } = await api.post('/products', payload);
    return data;
  },

  updateProduct: async (id, payload) => {
    const { data } = await api.put(`/products/${id}`, payload);
    return data;
  },

  deleteProduct: async (id) => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },

  getLookbookEntries: async () => {
    const { data } = await api.get('/admin/lookbook');
    return data;
  },

  createLookbookEntry: async (payload) => {
    const { data } = await api.post('/admin/lookbook', payload);
    return data;
  },

  updateLookbookEntry: async (id, payload) => {
    const { data } = await api.put(`/admin/lookbook/${id}`, payload);
    return data;
  },

  deleteLookbookEntry: async (id) => {
    const { data } = await api.delete(`/admin/lookbook/${id}`);
    return data;
  },

  getOrders: async (params) => {
    const { data } = await api.get('/admin/orders', { params });
    return data;
  },

  getOrder: async (id) => {
    const { data } = await api.get(`/admin/orders/${id}`);
    return data;
  },

  updateOrderFulfillment: async (id, payload) => {
    const { data } = await api.patch(`/admin/orders/${id}/fulfillment`, payload);
    return data;
  },

  getReturns: async (params) => {
    const { data } = await api.get('/admin/returns', { params });
    return data;
  },

  getReturn: async (id) => {
    const { data } = await api.get(`/admin/returns/${id}`);
    return data;
  },

  updateReturnStatus: async (id, payload) => {
    const { data } = await api.patch(`/admin/returns/${id}/status`, payload);
    return data;
  },

  getCoupons: async (params) => {
    const { data } = await api.get('/coupons', { params });
    return data;
  },

  createCoupon: async (payload) => {
    const { data } = await api.post('/coupons', payload);
    return data;
  },

  deleteCoupon: async (id) => {
    const { data } = await api.delete(`/coupons/${id}`);
    return data;
  },

  getContactMessages: async (params) => {
    const { data } = await api.get('/contact', { params });
    return data;
  },

  markContactMessageRead: async (id) => {
    const { data } = await api.put(`/contact/${id}/read`);
    return data;
  },

  deleteContactMessage: async (id) => {
    const { data } = await api.delete(`/contact/${id}`);
    return data;
  },
};
