import api from './axios';

export const ordersApi = {
  create: async (orderData, idempotencyKey) => {
    const config = idempotencyKey
      ? { headers: { 'Idempotency-Key': idempotencyKey } }
      : undefined;
    const { data } = await api.post('/orders', orderData, config);
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
};

export const contactApi = {
  submit: async (name, email, subject, message) => {
    const { data } = await api.post('/contact', { name, email, subject, message });
    return data;
  },
};

export const couponApi = {
  validate: async (code) => {
    const { data } = await api.post('/coupons/validate', { code });
    return data;
  },
};
