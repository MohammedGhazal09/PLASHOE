import { z } from 'zod';
import {
  emailSchema,
  objectIdSchema,
  optionalTrimmedString,
  queryBoolean,
  strictObject,
  trimmedString,
} from './shared.js';

export const contactParamsSchema = strictObject({
  id: objectIdSchema,
});

export const contactSubmissionSchema = strictObject({
  name: trimmedString('Name', 100),
  email: emailSchema,
  subject: optionalTrimmedString(160),
  message: trimmedString('Message', 2000),
});

const paginationNumber = (defaultValue, max) =>
  z.coerce
    .number()
    .int()
    .min(1)
    .default(defaultValue)
    .transform((value) => (max ? Math.min(value, max) : value));

export const contactAdminListQuerySchema = strictObject({
  page: paginationNumber(1),
  limit: paginationNumber(20, 100),
  isRead: queryBoolean,
  q: optionalTrimmedString(120),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
});
