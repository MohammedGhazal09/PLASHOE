import { z } from 'zod';
import {
  nonNegativeNumber,
  objectIdSchema,
  optionalTrimmedString,
  strictObject,
  trimmedString,
} from './shared.js';

const genderSchema = z.enum(['male', 'female']);
const categorySchema = z.enum(['Training', 'Running', 'Sneaker', 'Classic']);
const sortSchema = z.enum(['price-asc', 'price-desc', 'rating', 'newest']);
const searchSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().min(1).max(80).optional()
);
const optionalQueryNumber = (schema) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    schema.optional()
  );

const priceSchema = strictObject({
  original: nonNegativeNumber('price.original'),
  current: nonNegativeNumber('price.current'),
});

const materialSchema = strictObject({
  label: trimmedString('Material label', 80),
  value: trimmedString('Material value', 200),
});

const impactMetricSchema = strictObject({
  label: trimmedString('Impact metric label', 80),
  value: trimmedString('Impact metric value', 120),
  unit: optionalTrimmedString(40),
  source: trimmedString('Impact metric source', 240),
});

const certificationSchema = strictObject({
  name: trimmedString('Certification name', 120),
  issuer: trimmedString('Certification issuer', 160),
  url: optionalTrimmedString(500),
});

const manufacturingSchema = strictObject({
  location: optionalTrimmedString(160),
  facility: optionalTrimmedString(160),
  process: optionalTrimmedString(500),
  source: optionalTrimmedString(240),
}).refine(
  (value) => !(value.location || value.facility || value.process) || Boolean(value.source),
  {
    message: 'Manufacturing source is required when manufacturing details are provided',
    path: ['source'],
  }
);

const durabilitySchema = strictObject({
  summary: optionalTrimmedString(500),
  repairability: optionalTrimmedString(300),
  expectedUse: optionalTrimmedString(300),
  source: optionalTrimmedString(240),
}).refine(
  (value) => !(value.summary || value.repairability || value.expectedUse) || Boolean(value.source),
  {
    message: 'Durability source is required when durability details are provided',
    path: ['source'],
  }
);

const sustainabilitySchema = strictObject({
  summary: optionalTrimmedString(700),
  source: optionalTrimmedString(240),
  impactMetrics: z.array(impactMetricSchema).max(8).optional(),
  certifications: z.array(certificationSchema).max(8).optional(),
  manufacturing: manufacturingSchema.optional(),
  durability: durabilitySchema.optional(),
}).refine(
  (value) => !value.summary || Boolean(value.source),
  {
    message: 'Sustainability source is required when a sustainability summary is provided',
    path: ['source'],
  }
);

const fitGuideSchema = strictObject({
  summary: optionalTrimmedString(300),
  sizeNote: optionalTrimmedString(300),
  width: optionalTrimmedString(80),
  archSupport: optionalTrimmedString(80),
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
  gallery: z.array(trimmedString('gallery image', 500)).max(8).optional(),
  materials: z.array(materialSchema).max(8).optional(),
  careInstructions: z.array(trimmedString('care instruction', 160)).max(8).optional(),
  fitGuide: fitGuideSchema.optional(),
  sustainability: sustainabilitySchema.optional(),
});

export const productParamsSchema = strictObject({
  id: objectIdSchema,
});

export const productQuerySchema = strictObject({
  q: searchSchema,
  gender: genderSchema.optional(),
  category: categorySchema.optional(),
  size: optionalQueryNumber(z.coerce.number().int().min(35).max(45)),
  minPrice: optionalQueryNumber(z.coerce.number().min(0)),
  maxPrice: optionalQueryNumber(z.coerce.number().min(0)),
  minRating: optionalQueryNumber(z.coerce.number().min(0).max(5)),
  sale: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === 'true' ? true : undefined)),
  sort: sortSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  page: z.coerce.number().int().min(1).optional().default(1),
}).refine(
  (value) =>
    value.minPrice === undefined ||
    value.maxPrice === undefined ||
    value.minPrice <= value.maxPrice,
  {
    message: 'minPrice must be less than or equal to maxPrice',
    path: ['minPrice'],
  }
);

export const relatedProductsQuerySchema = strictObject({
  limit: z.coerce.number().int().min(1).max(8).optional().default(4),
});

export const createProductSchema = productBaseSchema;

export const updateProductSchema = productBaseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: 'At least one product field is required',
  }
);
