import api from './axios';

export const newsletterApi = {
  subscribe: async (payload) => {
    const { data } = await api.post('/newsletter', payload);
    return data;
  },

  unsubscribe: async (token) => {
    const { data } = await api.post(`/newsletter/unsubscribe/${token}`);
    return data;
  },
};
