import { z } from 'zod';
import {
  nonNegativeNumber,
  objectIdSchema,
  optionalTrimmedString,
  positiveInteger,
  strictObject,
  trimmedString,
} from './shared.js';

const genderSchema = z.enum(['male', 'female']);
const categorySchema = z.enum(['Training', 'Running', 'Sneaker', 'Classic']);
const sortSchema = z.enum(['price-asc', 'price-desc', 'rating', 'newest']);

const priceSchema = strictObject({
  original: nonNegativeNumber('price.original'),
  current: nonNegativeNumber('price.current'),
});

const productBaseSchema = strictObject({
  name: trimmedString('Product name', 160),
  gender: genderSchema,
  category: categorySchema,
  image: trimmedString('image', 500),
  price: priceSchema,
  rating: z.coerce.number().min(0).max(5).optional(),
  sizes: z.array(z.coerce.number().int().min(35).max(45)).min(1).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  isOnSale: z.boolean().optional(),
  description: optionalTrimmedString(2000),
});

export const productParamsSchema = strictObject({
  id: objectIdSchema,
});

export const productQuerySchema = strictObject({
  gender: genderSchema.optional(),
  category: categorySchema.optional(),
  sale: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === 'true' ? true : undefined)),
  sort: sortSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const createProductSchema = productBaseSchema;

export const updateProductSchema = productBaseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: 'At least one product field is required',
  }
);
