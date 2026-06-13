import api from './axios';
import { couponApi } from './couponApi';

jest.mock('./axios', () => ({
  post: jest.fn(),
}));

test('validate posts coupon code and returns unwrapped response data', async () => {
  api.post.mockResolvedValue({
    data: { success: true, data: { code: 'SAVE20', discountPercentage: 20 } },
  });

  const result = await couponApi.validate('SAVE20');

  expect(api.post).toHaveBeenCalledWith('/coupons/validate', { code: 'SAVE20' });
  expect(result).toEqual({ success: true, data: { code: 'SAVE20', discountPercentage: 20 } });
});
