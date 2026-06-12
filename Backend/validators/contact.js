import { emailSchema, optionalTrimmedString, strictObject, trimmedString } from './shared.js';

export const contactSubmissionSchema = strictObject({
  name: trimmedString('Name', 100),
  email: emailSchema,
  subject: optionalTrimmedString(160),
  message: trimmedString('Message', 2000),
});
