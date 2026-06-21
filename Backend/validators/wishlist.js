import { z } from 'zod';
import { objectIdSchema, strictObject } from './shared.js';

const wishlistPage = z.coerce.number().int('Page must be an integer').min(1).max(1000).default(1);
const wishlistLimit = z.coerce
  .number()
  .int('Limit must be an integer')
  .min(1)
  .max(100)
  .default(20);

export const wishlistListQuerySchema = strictObject({
  page: wishlistPage,
  limit: wishlistLimit,
});

export const wishlistItemBodySchema = strictObject({
  productId: objectIdSchema,
});

export const wishlistItemParamsSchema = strictObject({
  productId: objectIdSchema,
});

