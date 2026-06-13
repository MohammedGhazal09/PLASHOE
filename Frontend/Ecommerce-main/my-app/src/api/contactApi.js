import api from './axios';

export const contactApi = {
  submit: async (name, email, subject, message) => {
    const { data } = await api.post('/contact', { name, email, subject, message });
    return data;
  },
};
