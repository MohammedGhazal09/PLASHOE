import { z } from 'zod';
import { emailSchema, objectIdSchema, optionalTrimmedString, strictObject } from './shared.js';

const backInStockStatuses = ['pending', 'notified', 'cancelled'];
const adminUpdateStatuses = ['notified', 'cancelled'];

const paginationNumber = (defaultValue, max) =>
  z.coerce
    .number()
    .int()
    .min(1)
    .default(defaultValue)
    .transform((value) => (max ? Math.min(value, max) : value));

export const backInStockCreateSchema = strictObject({
  productId: objectIdSchema,
  size: z.coerce.number().int().min(35).max(45),
  email: emailSchema,
  consent: z.boolean().refine((value) => value === true, {
    message: 'Back-in-stock consent is required',
  }),
});

export const backInStockAdminListQuerySchema = strictObject({
  page: paginationNumber(1),
  limit: paginationNumber(20, 100),
  status: z.enum(backInStockStatuses).optional(),
  productId: objectIdSchema.optional(),
  size: z.coerce.number().int().min(35).max(45).optional(),
  email: optionalTrimmedString(254).transform((value) =>
    typeof value === 'string' ? value.toLowerCase() : value
  ),
  q: optionalTrimmedString(120),
});

export const backInStockParamsSchema = strictObject({
  id: objectIdSchema,
});

export const backInStockStatusUpdateSchema = strictObject({
  status: z.enum(adminUpdateStatuses),
});
