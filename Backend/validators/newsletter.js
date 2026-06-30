import { z } from 'zod';
import { emailSchema, optionalTrimmedString, strictObject } from './shared.js';

const newsletterStatuses = ['active', 'unsubscribed', 'suppressed'];

const paginationNumber = (defaultValue, max) =>
  z.coerce
    .number()
    .int()
    .min(1)
    .default(defaultValue)
    .transform((value) => (max ? Math.min(value, max) : value));

export const newsletterSubscribeSchema = strictObject({
  email: emailSchema,
  consent: z.boolean().refine((value) => value === true, {
    message: 'Newsletter consent is required',
  }),
  source: optionalTrimmedString(80).default('home_newsletter'),
});

export const newsletterUnsubscribeParamsSchema = strictObject({
  token: z.string().trim().regex(/^[a-f\d]{64}$/i, 'Invalid unsubscribe token'),
});

export const newsletterAdminListQuerySchema = strictObject({
  page: paginationNumber(1),
  limit: paginationNumber(20, 100),
  status: z.enum(newsletterStatuses).optional(),
  email: optionalTrimmedString(254).transform((value) =>
    typeof value === 'string' ? value.toLowerCase() : value
  ),
  source: optionalTrimmedString(80),
  q: optionalTrimmedString(120),
});
