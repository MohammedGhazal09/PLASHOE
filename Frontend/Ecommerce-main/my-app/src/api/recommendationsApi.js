import api from './axios';

export const recommendationsApi = {
  getRecommendations: async (params = {}) => {
    const { data } = await api.get('/recommendations', { params });
    return data;
  },
};

