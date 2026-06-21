import { z } from 'zod';
import { objectIdSchema, strictObject } from './shared.js';

export const recommendationQuerySchema = strictObject({
  productId: objectIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(8).optional().default(4),
});

