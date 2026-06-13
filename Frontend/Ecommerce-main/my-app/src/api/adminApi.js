import api from './axios';

export const adminApi = {
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

  getCoupons: async (params) => {
    const { data } = await api.get('/coupons', { params });
    return data;
  },

  getContactMessages: async (params) => {
    const { data } = await api.get('/contact', { params });
    return data;
  },
};
