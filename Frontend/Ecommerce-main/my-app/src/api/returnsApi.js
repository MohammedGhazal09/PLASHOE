import api from './axios';

export const returnsApi = {
  create: async (payload) => {
    const { data } = await api.post('/returns', payload);
    return data;
  },

  getMine: async (params) => {
    const { data } = await api.get('/returns', { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/returns/${id}`);
    return data;
  },
};
