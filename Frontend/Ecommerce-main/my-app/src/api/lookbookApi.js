import api from './axios';

export const lookbookApi = {
  getEntries: async () => {
    const { data } = await api.get('/lookbook');
    return data;
  },
};

