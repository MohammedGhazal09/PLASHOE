import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import helmet from 'helmet';
import { JSON_BODY_LIMITS, RATE_LIMITS } from '../config/security.js';

const TEST_RATE_LIMIT_HEADER = 'x-rate-limit-test';

const rateLimitKeyGenerator = (req) => {
  const testKey = req.get(TEST_RATE_LIMIT_HEADER);

  if (process.env.NODE_ENV === 'test' && testKey) {
    return `test:${testKey}`;
  }

  return ipKeyGenerator(req.ip);
};

const skipRateLimitInTests = (req) =>
  process.env.NODE_ENV === 'test' && !req.get(TEST_RATE_LIMIT_HEADER);

const createJsonRateLimit = ({ windowMs, max }, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: rateLimitKeyGenerator,
    skip: skipRateLimitInTests,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message,
      });
    },
  });

export const securityHeaders = helmet();

export const defaultJsonParser = express.json({
  limit: JSON_BODY_LIMITS.default,
});

export const strictJsonParser = express.json({
  limit: JSON_BODY_LIMITS.strict,
});

export const apiLimiter = createJsonRateLimit(
  RATE_LIMITS.globalApi,
  'Too many API requests, please try again later'
);

export const authLimiter = createJsonRateLimit(
  RATE_LIMITS.auth,
  'Too many authentication attempts, please try again later'
);

export const contactLimiter = createJsonRateLimit(
  RATE_LIMITS.contact,
  'Too many contact requests, please try again later'
);

export const couponValidationLimiter = createJsonRateLimit(
  RATE_LIMITS.couponValidation,
  'Too many coupon validation requests, please try again later'
);

export const handleSecurityErrors = (err, req, res, next) => {
  if (err?.type === 'entity.too.large' || err?.status === 413) {
    return res.status(413).json({
      success: false,
      message: 'Request body too large',
    });
  }

  next(err);
};
