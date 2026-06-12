import { z } from 'zod';
import { objectIdSchema, positiveInteger, strictObject, trimmedString } from './shared.js';

export const cartItemParamsSchema = strictObject({
  itemId: objectIdSchema,
});

export const addCartItemSchema = strictObject({
  productId: objectIdSchema,
  quantity: positiveInteger('quantity', 99).optional().default(1),
  size: z.coerce.number().int('size must be an integer').min(35).max(45),
});

export const updateCartItemSchema = strictObject({
  quantity: positiveInteger('quantity', 99),
});

export const cartCouponSchema = strictObject({
  code: trimmedString('code', 64).transform((value) => value.toUpperCase()),
});
