import { z } from 'zod';
import { emailSchema, objectIdSchema, strictObject } from './shared.js';

export const backInStockCreateSchema = strictObject({
  productId: objectIdSchema,
  size: z.coerce.number().int().min(35).max(45),
  email: emailSchema,
  consent: z.boolean().refine((value) => value === true, {
    message: 'Back-in-stock consent is required',
  }),
});
