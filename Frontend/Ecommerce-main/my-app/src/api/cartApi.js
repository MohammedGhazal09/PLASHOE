import api from './axios';

export const cartApi = {
  getCart: async () => {
    const { data } = await api.get('/cart');
    return data;
  },

  addItem: async (productId, quantity, size) => {
    const { data } = await api.post('/cart/items', { productId, quantity, size });
    return data;
  },

  updateItem: async (itemId, quantity) => {
    const { data } = await api.put(`/cart/items/${itemId}`, { quantity });
    return data;
  },

  removeItem: async (itemId) => {
    const { data } = await api.delete(`/cart/items/${itemId}`);
    return data;
  },

  clearCart: async () => {
    const { data } = await api.delete('/cart');
    return data;
  },

  applyCoupon: async (code) => {
    const { data } = await api.post('/cart/coupon', { code });
    return data;
  },

  removeCoupon: async () => {
    const { data } = await api.delete('/cart/coupon');
    return data;
  },
};
