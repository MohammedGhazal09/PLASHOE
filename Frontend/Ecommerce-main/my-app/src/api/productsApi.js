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

  getMen: async (params = {}) => {
    const { data } = await api.get('/products/men', { params });
    return data;
  },

  getWomen: async (params = {}) => {
    const { data } = await api.get('/products/women', { params });
    return data;
  },

  getSale: async (params = {}) => {
    const { data } = await api.get('/products/sale', { params });
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
