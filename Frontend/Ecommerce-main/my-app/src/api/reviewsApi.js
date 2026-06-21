import api from './axios';

export const reviewsApi = {
  getReviews: async (productId, params = {}) => {
    const { data } = await api.get(`/products/${productId}/reviews`, { params });
    return data;
  },

  createReview: async (productId, payload) => {
    const { data } = await api.post(`/products/${productId}/reviews`, payload);
    return data;
  },
};

