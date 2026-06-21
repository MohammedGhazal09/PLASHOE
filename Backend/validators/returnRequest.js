import { z } from 'zod';
import {
  RETURN_REQUEST_STATUSES,
  RETURN_REQUEST_TYPES,
} from '../models/ReturnRequest.js';
import {
  nonNegativeNumber,
  objectIdSchema,
  optionalTrimmedString,
  positiveInteger,
  strictObject,
  trimmedString,
} from './shared.js';

const paginationNumber = (defaultValue, max) =>
  z.coerce
    .number()
    .int()
    .min(1)
    .default(defaultValue)
    .transform((value) => (max ? Math.min(value, max) : value));

export const returnRequestParamsSchema = strictObject({
  id: objectIdSchema,
});

export const returnRequestListQuerySchema = strictObject({
  orderId: objectIdSchema.optional(),
  status: z.enum(RETURN_REQUEST_STATUSES).optional(),
});

export const adminReturnRequestListQuerySchema = strictObject({
  page: paginationNumber(1),
  limit: paginationNumber(20, 100),
  status: z.enum(RETURN_REQUEST_STATUSES).optional(),
  type: z.enum(RETURN_REQUEST_TYPES).optional(),
  q: optionalTrimmedString(120),
});

const returnRequestItemSchema = strictObject({
  orderItemId: objectIdSchema,
  quantity: positiveInteger('quantity', 100),
  reason: trimmedString('reason', 180),
  exchangeSize: z.coerce.number().int().min(1).max(60).optional(),
});

export const createReturnRequestSchema = strictObject({
  orderId: objectIdSchema,
  type: z.enum(RETURN_REQUEST_TYPES),
  items: z.array(returnRequestItemSchema).min(1).max(20),
  customerNotes: optionalTrimmedString(600),
});

export const adminReturnStatusUpdateSchema = strictObject({
  status: z.enum(['approved', 'rejected', 'received', 'resolved']),
  note: optionalTrimmedString(600),
  refundAmount: nonNegativeNumber('refundAmount').optional(),
});
