import api from './axios';

export const backInStockApi = {
  createRequest: async (payload) => {
    const { data } = await api.post('/back-in-stock', payload);
    return data;
  },
};

