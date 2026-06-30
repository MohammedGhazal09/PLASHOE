import { JWT_SECURITY } from './security.js';

const DURATION_PATTERN = /^\d+\s*(ms|s|m|h|d|w|y)?$/i;
const TEMPLATE_PLACEHOLDER_PATTERN =
  /^<[^>]+>$|(?:^|[-_\s])(replace(?:[-_\s]?me)?|change(?:[-_\s]?me)?|placeholder|example)(?:[-_\s]|$)|^your[-_\s]/i;
const VALID_PAYMENT_PROVIDERS = new Set(['stripe', 'paypal', 'mock']);
const VALID_PAYPAL_ENVS = new Set(['sandbox', 'live']);

export const PAYMENT_PROVIDER_MODES = Object.freeze({
  STRIPE: 'stripe',
  PAYPAL: 'paypal',
  MOCK: 'mock',
});

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

const hasCompleteStripeConfig = ({
  stripeSecretKey,
  stripeWebhookSecret,
  paymentSuccessUrl,
  paymentCancelUrl,
}) =>
  Boolean(stripeSecretKey && stripeWebhookSecret && paymentSuccessUrl && paymentCancelUrl);

const hasCompletePayPalConfig = ({
  paypalClientId,
  paypalClientSecret,
  paypalWebhookId,
  paymentSuccessUrl,
  paymentCancelUrl,
}) =>
  Boolean(
    paypalClientId &&
      paypalClientSecret &&
      paypalWebhookId &&
      paymentSuccessUrl &&
      paymentCancelUrl
  );

export const hasCompleteStripeRuntimeConfig = (env = process.env) =>
  hasCompleteStripeConfig({
    stripeSecretKey: getTrimmed(env, 'STRIPE_SECRET_KEY'),
    stripeWebhookSecret: getTrimmed(env, 'STRIPE_WEBHOOK_SECRET'),
    paymentSuccessUrl: getTrimmed(env, 'PAYMENT_SUCCESS_URL'),
    paymentCancelUrl: getTrimmed(env, 'PAYMENT_CANCEL_URL'),
  });

export const hasCompletePayPalRuntimeConfig = (env = process.env) =>
  hasCompletePayPalConfig({
    paypalClientId: getTrimmed(env, 'PAYPAL_CLIENT_ID'),
    paypalClientSecret: getTrimmed(env, 'PAYPAL_CLIENT_SECRET'),
    paypalWebhookId: getTrimmed(env, 'PAYPAL_WEBHOOK_ID'),
    paymentSuccessUrl: getTrimmed(env, 'PAYMENT_SUCCESS_URL'),
    paymentCancelUrl: getTrimmed(env, 'PAYMENT_CANCEL_URL'),
  });

export const resolvePaymentProviderMode = (env = process.env) => {
  if (!parsePaymentsEnabled(env)) {
    return PAYMENT_PROVIDER_MODES.MOCK;
  }

  const requestedProvider = getTrimmed(env, 'PAYMENT_PROVIDER').toLowerCase();

  if (requestedProvider === PAYMENT_PROVIDER_MODES.MOCK) {
    return PAYMENT_PROVIDER_MODES.MOCK;
  }

  if (requestedProvider === PAYMENT_PROVIDER_MODES.PAYPAL) {
    return hasCompletePayPalRuntimeConfig(env)
      ? PAYMENT_PROVIDER_MODES.PAYPAL
      : PAYMENT_PROVIDER_MODES.MOCK;
  }

  if (requestedProvider === PAYMENT_PROVIDER_MODES.STRIPE) {
    return hasCompleteStripeRuntimeConfig(env)
      ? PAYMENT_PROVIDER_MODES.STRIPE
      : PAYMENT_PROVIDER_MODES.MOCK;
  }

  if (!requestedProvider && hasCompleteStripeRuntimeConfig(env)) {
    return PAYMENT_PROVIDER_MODES.STRIPE;
  }

  return PAYMENT_PROVIDER_MODES.MOCK;
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
  const paymentProviderPreference = getTrimmed(env, 'PAYMENT_PROVIDER').toLowerCase();
  const stripeSecretKey = getTrimmed(env, 'STRIPE_SECRET_KEY');
  const stripeWebhookSecret = getTrimmed(env, 'STRIPE_WEBHOOK_SECRET');
  const paypalEnv = (getTrimmed(env, 'PAYPAL_ENV') || 'sandbox').toLowerCase();
  const paypalClientId = getTrimmed(env, 'PAYPAL_CLIENT_ID');
  const paypalClientSecret = getTrimmed(env, 'PAYPAL_CLIENT_SECRET');
  const paypalWebhookId = getTrimmed(env, 'PAYPAL_WEBHOOK_ID');
  const paymentSuccessUrl = getTrimmed(env, 'PAYMENT_SUCCESS_URL');
  const paymentCancelUrl = getTrimmed(env, 'PAYMENT_CANCEL_URL');
  const paymentProviderMode = resolvePaymentProviderMode(env);
  const paymentsEnabled = paymentProviderMode !== PAYMENT_PROVIDER_MODES.MOCK;

  if (paymentProviderPreference && !VALID_PAYMENT_PROVIDERS.has(paymentProviderPreference)) {
    errors.push('PAYMENT_PROVIDER must be stripe, paypal, or mock');
  }

  if (paypalEnv && !VALID_PAYPAL_ENVS.has(paypalEnv)) {
    errors.push('PAYPAL_ENV must be sandbox or live');
  }

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

  if (paymentProviderMode === PAYMENT_PROVIDER_MODES.STRIPE) {
    rejectTemplatePlaceholder(stripeSecretKey, 'STRIPE_SECRET_KEY', env, errors);
    rejectTemplatePlaceholder(stripeWebhookSecret, 'STRIPE_WEBHOOK_SECRET', env, errors);
    normalizedPaymentSuccessUrl = validateUrl(paymentSuccessUrl, 'PAYMENT_SUCCESS_URL', errors);
    normalizedPaymentCancelUrl = validateUrl(paymentCancelUrl, 'PAYMENT_CANCEL_URL', errors);
  }

  if (paymentProviderMode === PAYMENT_PROVIDER_MODES.PAYPAL) {
    rejectTemplatePlaceholder(paypalClientId, 'PAYPAL_CLIENT_ID', env, errors);
    rejectTemplatePlaceholder(paypalClientSecret, 'PAYPAL_CLIENT_SECRET', env, errors);
    rejectTemplatePlaceholder(paypalWebhookId, 'PAYPAL_WEBHOOK_ID', env, errors);
    normalizedPaymentSuccessUrl = validateUrl(paymentSuccessUrl, 'PAYMENT_SUCCESS_URL', errors);
    normalizedPaymentCancelUrl = validateUrl(paymentCancelUrl, 'PAYMENT_CANCEL_URL', errors);
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
    paymentProviderMode,
    stripeSecretKey,
    stripeWebhookSecret,
    paypalEnv,
    paypalClientId,
    paypalClientSecret,
    paypalWebhookId,
    paymentSuccessUrl: normalizedPaymentSuccessUrl,
    paymentCancelUrl: normalizedPaymentCancelUrl,
  };
};
