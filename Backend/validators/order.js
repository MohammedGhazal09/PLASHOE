import {
  objectIdSchema,
  optionalTrimmedString,
  strictObject,
  trimmedString,
} from './shared.js';

export const orderParamsSchema = strictObject({
  id: objectIdSchema,
});

export const shippingAddressSchema = strictObject({
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
});

export const createOrderSchema = strictObject({
  shippingAddress: shippingAddressSchema,
  notes: optionalTrimmedString(500),
});
