import { JWT_SECURITY } from './security.js';

const DURATION_PATTERN = /^\d+\s*(ms|s|m|h|d|w|y)?$/i;
const TEMPLATE_PLACEHOLDER_PATTERN =
  /^<[^>]+>$|(?:^|[-_\s])(replace(?:[-_\s]?me)?|change(?:[-_\s]?me)?|placeholder|example)(?:[-_\s]|$)|^your[-_\s]/i;

const getTrimmed = (env, key) => {
  const value = env[key];
  return typeof value === 'string' ? value.trim() : '';
};

const validateUrl = (value, key, errors) => {
  try {
    const url = new URL(value);

    if (!['http:', 'https:'].includes(url.protocol)) {
      errors.push(`${key} must use http or https`);
    }

    return url.toString().replace(/\/$/, '');
  } catch {
    errors.push(`${key} must be a valid URL`);
    return value;
  }
};

const parsePort = (value, errors) => {
  if (!value) {
    return 5000;
  }

  if (!/^\d+$/.test(value)) {
    errors.push('PORT must be a positive integer');
    return value;
  }

  const port = Number(value);

  if (port < 1 || port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }

  return port;
};

const parsePaymentsEnabled = (env) => {
  const raw = getTrimmed(env, 'PAYMENTS_ENABLED');

  if (!raw && env.NODE_ENV === 'test') {
    return false;
  }

  return raw.toLowerCase() !== 'false';
};

const rejectTemplatePlaceholder = (value, key, env, errors) => {
  if (env.NODE_ENV === 'test' || !value) {
    return;
  }

  if (TEMPLATE_PLACEHOLDER_PATTERN.test(value)) {
    errors.push(`${key} must be replaced with a real value, not a template placeholder`);
  }
};

export const validateRuntimeEnv = (env = process.env) => {
  const errors = [];
  const mongoUri = getTrimmed(env, 'MONGO_URI');
  const jwtSecret = getTrimmed(env, 'JWT_SECRET');
  const frontendUrl = getTrimmed(env, 'FRONTEND_URL');
  const jwtExpire = getTrimmed(env, 'JWT_EXPIRE') || JWT_SECURITY.defaultExpiresIn;
  const portValue = getTrimmed(env, 'PORT');
  const paymentsEnabled = parsePaymentsEnabled(env);
  const stripeSecretKey = getTrimmed(env, 'STRIPE_SECRET_KEY');
  const stripeWebhookSecret = getTrimmed(env, 'STRIPE_WEBHOOK_SECRET');
  const paymentSuccessUrl = getTrimmed(env, 'PAYMENT_SUCCESS_URL');
  const paymentCancelUrl = getTrimmed(env, 'PAYMENT_CANCEL_URL');

  if (!mongoUri) {
    errors.push('MONGO_URI is required');
  } else {
    rejectTemplatePlaceholder(mongoUri, 'MONGO_URI', env, errors);
  }

  if (!jwtSecret) {
    errors.push('JWT_SECRET is required');
  } else if (jwtSecret.length < JWT_SECURITY.minSecretLength) {
    errors.push(`JWT_SECRET must be at least ${JWT_SECURITY.minSecretLength} characters`);
  } else {
    rejectTemplatePlaceholder(jwtSecret, 'JWT_SECRET', env, errors);
  }

  let normalizedFrontendUrl = frontendUrl;
  if (!frontendUrl) {
    errors.push('FRONTEND_URL is required');
  } else {
    normalizedFrontendUrl = validateUrl(frontendUrl, 'FRONTEND_URL', errors);
  }

  if (!DURATION_PATTERN.test(jwtExpire)) {
    errors.push('JWT_EXPIRE must be a jsonwebtoken duration such as 1h, 30m, or 2h');
  }

  const port = parsePort(portValue, errors);

  let normalizedPaymentSuccessUrl = paymentSuccessUrl;
  let normalizedPaymentCancelUrl = paymentCancelUrl;

  if (paymentsEnabled) {
    if (!stripeSecretKey) {
      errors.push('STRIPE_SECRET_KEY is required when payments are enabled');
    } else {
      rejectTemplatePlaceholder(stripeSecretKey, 'STRIPE_SECRET_KEY', env, errors);
    }

    if (!stripeWebhookSecret) {
      errors.push('STRIPE_WEBHOOK_SECRET is required when payments are enabled');
    } else {
      rejectTemplatePlaceholder(stripeWebhookSecret, 'STRIPE_WEBHOOK_SECRET', env, errors);
    }

    if (!paymentSuccessUrl) {
      errors.push('PAYMENT_SUCCESS_URL is required when payments are enabled');
    } else {
      normalizedPaymentSuccessUrl = validateUrl(paymentSuccessUrl, 'PAYMENT_SUCCESS_URL', errors);
    }

    if (!paymentCancelUrl) {
      errors.push('PAYMENT_CANCEL_URL is required when payments are enabled');
    } else {
      normalizedPaymentCancelUrl = validateUrl(paymentCancelUrl, 'PAYMENT_CANCEL_URL', errors);
    }
  }

  if (errors.length > 0) {
    const error = new Error(`Invalid runtime configuration: ${errors.join('; ')}`);
    error.details = errors;
    throw error;
  }

  return {
    mongoUri,
    jwtSecret,
    jwtExpire,
    frontendUrl: normalizedFrontendUrl,
    port,
    paymentsEnabled,
    stripeSecretKey,
    stripeWebhookSecret,
    paymentSuccessUrl: normalizedPaymentSuccessUrl,
    paymentCancelUrl: normalizedPaymentCancelUrl,
  };
};
