import { z } from 'zod';
import {
  nonNegativeNumber,
  objectIdSchema,
  optionalTrimmedString,
  positiveInteger,
  queryBoolean,
  strictObject,
  trimmedString,
} from './shared.js';

export const couponParamsSchema = strictObject({
  id: objectIdSchema,
});

export const couponValidationSchema = strictObject({
  code: trimmedString('code', 64).transform((value) => value.toUpperCase()),
});

export const couponCreateSchema = strictObject({
  code: trimmedString('code', 64).transform((value) => value.toUpperCase()),
  discountPercentage: z.coerce.number().min(0).max(100),
  minOrderAmount: nonNegativeNumber('minOrderAmount').optional().default(0),
  maxUses: positiveInteger('maxUses', 100000).nullable().optional(),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
  isActive: z.boolean().optional().default(true),
});

export const couponCodeOnlySchema = strictObject({
  code: optionalTrimmedString(64).transform((value) =>
    typeof value === 'string' ? value.toUpperCase() : value
  ),
});

const paginationNumber = (defaultValue, max) =>
  z.coerce
    .number()
    .int()
    .min(1)
    .default(defaultValue)
    .transform((value) => (max ? Math.min(value, max) : value));

export const couponAdminListQuerySchema = strictObject({
  page: paginationNumber(1),
  limit: paginationNumber(20, 100),
  isActive: queryBoolean,
  q: optionalTrimmedString(120),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
});
