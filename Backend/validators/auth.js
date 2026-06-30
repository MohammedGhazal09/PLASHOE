import { z } from 'zod';
import {
  emailSchema,
  objectIdSchema,
  optionalTrimmedString,
  strictObject,
  trimmedString,
} from './shared.js';

export const registerSchema = strictObject({
  name: trimmedString('Name', 100),
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export const loginSchema = strictObject({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128),
});

export const profileSchema = strictObject({
  name: optionalTrimmedString(100),
  phone: z.string().trim().max(40).optional(),
}).refine((value) => Object.values(value).some((entry) => entry !== undefined), {
  message: 'At least one profile field is required',
});

export const addressSchema = strictObject({
  firstName: trimmedString('firstName', 80),
  lastName: trimmedString('lastName', 80),
  company: optionalTrimmedString(120),
  country: trimmedString('country', 80),
  street: trimmedString('street', 160),
  apartment: optionalTrimmedString(80),
  city: trimmedString('city', 80),
  state: trimmedString('state', 80),
  zipCode: trimmedString('zipCode', 30),
  phone: trimmedString('phone', 40),
  isDefault: z.boolean().optional().default(false),
});

export const addressParamsSchema = strictObject({
  id: objectIdSchema,
});
