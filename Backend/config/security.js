export const JSON_BODY_LIMITS = {
  strict: '8kb',
  default: '64kb',
};

export const RATE_LIMITS = {
  globalApi: {
    windowMs: 15 * 60 * 1000,
    max: 300,
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 5,
  },
  contact: {
    windowMs: 60 * 60 * 1000,
    max: 5,
  },
  couponValidation: {
    windowMs: 15 * 60 * 1000,
    max: 30,
  },
};

export const JWT_SECURITY = {
  algorithm: 'HS256',
  algorithms: ['HS256'],
  defaultExpiresIn: '1h',
  minSecretLength: 32,
};
