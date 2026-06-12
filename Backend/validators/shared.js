import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const trimmedString = (field, max = 255) =>
  z.string().trim().min(1, `${field} is required`).max(max);

export const optionalTrimmedString = (max = 255) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().max(max).optional()
  );

export const emailSchema = z
  .string()
  .trim()
  .email('Email must be valid')
  .transform((value) => value.toLowerCase());

export const positiveInteger = (field, max = 1000) =>
  z.coerce.number().int(`${field} must be an integer`).min(1).max(max);

export const nonNegativeNumber = (field) =>
  z.coerce.number().min(0, `${field} must be non-negative`);

export const booleanSchema = z.boolean();

export const strictObject = (shape) => z.object(shape).strict();
