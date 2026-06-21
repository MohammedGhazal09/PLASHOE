import { z } from 'zod';
import {
  objectIdSchema,
  optionalTrimmedString,
  strictObject,
  trimmedString,
} from './shared.js';

const statusSchema = z.enum(['draft', 'active']);
const coordinateSchema = z.coerce.number().min(0).max(100);
const sizeSchema = z.coerce.number().int().min(35).max(45);

const hotspotSchema = strictObject({
  productId: objectIdSchema,
  x: coordinateSchema,
  y: coordinateSchema,
  label: optionalTrimmedString(120),
});

const bundleItemSchema = strictObject({
  productId: objectIdSchema,
  defaultSize: sizeSchema.optional(),
  quantity: z.coerce.number().int().min(1).max(5).optional(),
});

const bundleSchema = strictObject({
  title: trimmedString('Bundle title', 160),
  description: optionalTrimmedString(600),
  items: z.array(bundleItemSchema).min(1).max(8),
});

const lookbookBaseSchema = strictObject({
  title: trimmedString('Lookbook title', 160),
  description: optionalTrimmedString(900),
  image: trimmedString('Lookbook image', 500),
  status: statusSchema.optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  hotspots: z.array(hotspotSchema).max(10).optional(),
  bundle: bundleSchema.optional(),
});

export const lookbookParamsSchema = strictObject({
  id: objectIdSchema,
});

export const createLookbookEntrySchema = lookbookBaseSchema;

export const updateLookbookEntrySchema = lookbookBaseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: 'At least one lookbook field is required',
  }
);

