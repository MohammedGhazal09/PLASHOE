import { z } from 'zod';
import {
  objectIdSchema,
  positiveInteger,
  strictObject,
  trimmedString,
} from './shared.js';

export const reviewParamsSchema = strictObject({
  id: objectIdSchema,
});

export const reviewListQuerySchema = strictObject({
  page: positiveInteger('Page', 1000).optional().default(1),
  limit: positiveInteger('Limit', 100).optional().default(20),
});

export const reviewCreateSchema = strictObject({
  rating: z.coerce.number().int('Rating must be an integer').min(1).max(5),
  title: trimmedString('Review title', 120),
  comment: trimmedString('Review comment', 1000),
  fit: z.enum(['runs_small', 'true_to_size', 'runs_large']).optional(),
});
