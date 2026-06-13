import { z } from 'zod';
import { PAYMENT_STATUSES } from '../models/Order.js';
import {
  objectIdSchema,
  optionalTrimmedString,
  strictObject,
} from './shared.js';

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const FULFILLMENT_UPDATE_STATUSES = ['processing', 'shipped', 'delivered'];

const paginationNumber = (defaultValue, max) =>
  z.coerce
    .number()
    .int()
    .min(1)
    .default(defaultValue)
    .transform((value) => (max ? Math.min(value, max) : value));

const optionalDate = z.coerce.date().optional();

export const adminOrderParamsSchema = strictObject({
  id: objectIdSchema,
});

export const adminOrderListQuerySchema = strictObject({
  page: paginationNumber(1),
  limit: paginationNumber(20, 100),
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  q: optionalTrimmedString(120),
  createdFrom: optionalDate,
  createdTo: optionalDate,
});

export const adminFulfillmentUpdateSchema = strictObject({
  status: z.enum(FULFILLMENT_UPDATE_STATUSES),
  carrier: optionalTrimmedString(120),
  trackingNumber: optionalTrimmedString(120),
  estimatedDeliveryDate: optionalDate,
  description: optionalTrimmedString(300),
  location: optionalTrimmedString(120),
});
