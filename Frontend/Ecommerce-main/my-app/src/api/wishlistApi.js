import api from './axios';

export const wishlistApi = {
  getWishlist: async (params = {}) => {
    const { data } = await api.get('/wishlist', { params });
    return data;
  },

  addItem: async (productId) => {
    const { data } = await api.post('/wishlist/items', { productId });
    return data;
  },

  removeItem: async (productId) => {
    const { data } = await api.delete(`/wishlist/items/${productId}`);
    return data;
  },
};

