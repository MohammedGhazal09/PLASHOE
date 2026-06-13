import api from './axios';

export const couponApi = {
  validate: async (code) => {
    const { data } = await api.post('/coupons/validate', { code });
    return data;
  },
};
