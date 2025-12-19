import api from './axios';

export const productsApi = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/products', { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },

  getMen: async () => {
    const { data } = await api.get('/products/men');
    return data;
  },

  getWomen: async () => {
    const { data } = await api.get('/products/women');
    return data;
  },

  getSale: async () => {
    const { data } = await api.get('/products/sale');
    return data;
  },

  getBestsellers: async () => {
    const { data } = await api.get('/products/bestsellers');
    return data;
  },

  getCategories: async () => {
    const { data } = await api.get('/products/categories');
    return data;
  },
};
