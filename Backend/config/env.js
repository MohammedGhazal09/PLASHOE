import { JWT_SECURITY } from './security.js';

const DURATION_PATTERN = /^\d+\s*(ms|s|m|h|d|w|y)?$/i;

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

export const validateRuntimeEnv = (env = process.env) => {
  const errors = [];
  const mongoUri = getTrimmed(env, 'MONGO_URI');
  const jwtSecret = getTrimmed(env, 'JWT_SECRET');
  const frontendUrl = getTrimmed(env, 'FRONTEND_URL');
  const jwtExpire = getTrimmed(env, 'JWT_EXPIRE') || JWT_SECURITY.defaultExpiresIn;
  const portValue = getTrimmed(env, 'PORT');

  if (!mongoUri) {
    errors.push('MONGO_URI is required');
  }

  if (!jwtSecret) {
    errors.push('JWT_SECRET is required');
  } else if (jwtSecret.length < JWT_SECURITY.minSecretLength) {
    errors.push(`JWT_SECRET must be at least ${JWT_SECURITY.minSecretLength} characters`);
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
  };
};
