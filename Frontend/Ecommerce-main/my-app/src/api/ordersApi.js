import api from './axios';

export const ordersApi = {
  create: async (orderData, idempotencyKey) => {
    const config = idempotencyKey
      ? { headers: { 'Idempotency-Key': idempotencyKey } }
      : undefined;
    const { data } = await api.post('/orders', orderData, config);
    return data;
  },

  getShippingOptions: async (country) => {
    const { data } = await api.post('/orders/shipping-options', { country });
    return data;
  },

  getAll: async () => {
    const { data } = await api.get('/orders');
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/orders/${id}`);
    return data;
  },

  cancel: async (id) => {
    const { data } = await api.put(`/orders/${id}/cancel`);
    return data;
  },

  completeMockPayment: async (id, outcome) => {
    const { data } = await api.post(`/orders/${id}/payment/mock`, { outcome });
    return data;
  },

  reorder: async (id) => {
    const { data } = await api.post(`/orders/${id}/reorder`);
    return data;
  },
};
