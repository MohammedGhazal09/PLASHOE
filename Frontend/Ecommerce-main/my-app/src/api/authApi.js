import api from './axios';

export const authApi = {
  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    return data;
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  updateProfile: async (profileData) => {
    const { data } = await api.put('/auth/profile', profileData);
    return data;
  },

  addAddress: async (address) => {
    const { data } = await api.post('/auth/addresses', address);
    return data;
  },

  deleteAddress: async (addressId) => {
    const { data } = await api.delete(`/auth/addresses/${addressId}`);
    return data;
  },
};
