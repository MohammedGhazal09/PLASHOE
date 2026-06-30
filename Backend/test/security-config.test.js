import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { validateRuntimeEnv } from "../config/env.js";

const parseEnvExample = (content) =>
  content.split(/\r?\n/).reduce((env, line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return env;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      return env;
    }

    env[trimmed.slice(0, separatorIndex)] = trimmed.slice(separatorIndex + 1);
    return env;
  }, {});

const baseEnv = {
  MONGO_URI: "mongodb://localhost:27017/plashoe-test",
  JWT_SECRET: "strong-test-secret-with-at-least-32-characters",
  FRONTEND_URL: "http://localhost:3000",
  JWT_EXPIRE: "1h",
  PORT: "5000",
};

const paymentEnv = {
  STRIPE_SECRET_KEY: "sk_live_fake_key_for_config_validation_only",
  STRIPE_WEBHOOK_SECRET: "whsec_fake_secret_for_config_validation_only",
};

const paypalEnv = {
  PAYMENT_PROVIDER: "paypal",
  PAYPAL_ENV: "sandbox",
  PAYPAL_CLIENT_ID: "paypal_client_id_for_config_validation_only",
  PAYPAL_CLIENT_SECRET: "paypal_client_secret_for_config_validation_only",
  PAYPAL_WEBHOOK_ID: "paypal_webhook_id_for_config_validation_only",
};

describe("runtime configuration validation", () => {
  it("accepts valid runtime configuration", () => {
    expect(validateRuntimeEnv({ ...baseEnv, PAYMENTS_ENABLED: "false" })).toMatchObject({
      mongoUri: baseEnv.MONGO_URI,
      jwtSecret: baseEnv.JWT_SECRET,
      jwtExpire: "1h",
      frontendUrl: "http://localhost:3000",
      port: 5000,
      paymentsEnabled: false,
      paymentProviderMode: "mock",
    });
  });

  it("fails when required database config is missing", () => {
    expect(() => validateRuntimeEnv({ ...baseEnv, MONGO_URI: "" })).toThrow(
      /MONGO_URI is required/
    );
  });

  it("fails when the JWT secret is missing or weak", () => {
    expect(() => validateRuntimeEnv({ ...baseEnv, JWT_SECRET: "" })).toThrow(
      /JWT_SECRET is required/
    );

    expect(() => validateRuntimeEnv({ ...baseEnv, JWT_SECRET: "short-secret" })).toThrow(
      /at least 32 characters/
    );
  });

  it("fails when production config still contains template placeholders", () => {
    const envExample = fs.readFileSync(new URL("../.env.example", import.meta.url), "utf8");
    const parsedExample = parseEnvExample(envExample);

    expect(() =>
      validateRuntimeEnv({
        ...parsedExample,
        NODE_ENV: "production",
        PAYMENTS_ENABLED: "true",
      })
    ).toThrow(/must be replaced with a real value, not a template placeholder/);
  });

  it("fails when FRONTEND_URL is missing or malformed", () => {
    expect(() => validateRuntimeEnv({ ...baseEnv, FRONTEND_URL: "" })).toThrow(
      /FRONTEND_URL is required/
    );

    expect(() => validateRuntimeEnv({ ...baseEnv, FRONTEND_URL: "not a url" })).toThrow(
      /FRONTEND_URL must be a valid URL/
    );
  });

  it("validates optional PORT and JWT_EXPIRE values when provided", () => {
    expect(() => validateRuntimeEnv({ ...baseEnv, PORT: "0" })).toThrow(
      /PORT must be between 1 and 65535/
    );

    expect(() => validateRuntimeEnv({ ...baseEnv, JWT_EXPIRE: "forever" })).toThrow(
      /JWT_EXPIRE must be a jsonwebtoken duration/
    );
  });

  it("disables payment config by default only in tests", () => {
    expect(validateRuntimeEnv({ ...baseEnv, NODE_ENV: "test" })).toMatchObject({
      paymentsEnabled: false,
      paymentProviderMode: "mock",
    });
  });

  it("uses mock payment mode when Stripe config is incomplete", () => {
    expect(validateRuntimeEnv({ ...baseEnv, PAYMENTS_ENABLED: "true" })).toMatchObject({
      paymentsEnabled: false,
      paymentProviderMode: "mock",
    });
    expect(validateRuntimeEnv({ ...baseEnv, NODE_ENV: "production" })).toMatchObject({
      paymentsEnabled: false,
      paymentProviderMode: "mock",
    });
    expect(
      validateRuntimeEnv({
        ...baseEnv,
        PAYMENTS_ENABLED: "true",
        STRIPE_SECRET_KEY: paymentEnv.STRIPE_SECRET_KEY,
      })
    ).toMatchObject({
      paymentsEnabled: false,
      paymentProviderMode: "mock",
    });
  });

  it("uses Stripe mode when full payment config is present", () => {
    expect(
      validateRuntimeEnv({
        ...baseEnv,
        PAYMENTS_ENABLED: "true",
        ...paymentEnv,
        PAYMENT_SUCCESS_URL: "http://localhost:3000/checkout/success",
        PAYMENT_CANCEL_URL: "http://localhost:3000/checkout/cancel",
      })
    ).toMatchObject({
      paymentsEnabled: true,
      paymentProviderMode: "stripe",
      paymentSuccessUrl: "http://localhost:3000/checkout/success",
      paymentCancelUrl: "http://localhost:3000/checkout/cancel",
    });
  });

  it("uses PayPal mode when PayPal is requested and full sandbox config is present", () => {
    expect(
      validateRuntimeEnv({
        ...baseEnv,
        PAYMENTS_ENABLED: "true",
        ...paypalEnv,
        PAYMENT_SUCCESS_URL: "http://localhost:3000/checkout/success",
        PAYMENT_CANCEL_URL: "http://localhost:3000/checkout/cancel",
      })
    ).toMatchObject({
      paymentsEnabled: true,
      paymentProviderMode: "paypal",
      paypalEnv: "sandbox",
      paypalClientId: paypalEnv.PAYPAL_CLIENT_ID,
      paypalWebhookId: paypalEnv.PAYPAL_WEBHOOK_ID,
      paymentSuccessUrl: "http://localhost:3000/checkout/success",
      paymentCancelUrl: "http://localhost:3000/checkout/cancel",
    });
  });

  it("falls back to mock mode when PayPal is requested but sandbox config is incomplete", () => {
    expect(
      validateRuntimeEnv({
        ...baseEnv,
        PAYMENTS_ENABLED: "true",
        PAYMENT_PROVIDER: "paypal",
        PAYPAL_CLIENT_ID: paypalEnv.PAYPAL_CLIENT_ID,
        PAYMENT_SUCCESS_URL: "http://localhost:3000/checkout/success",
        PAYMENT_CANCEL_URL: "http://localhost:3000/checkout/cancel",
      })
    ).toMatchObject({
      paymentsEnabled: false,
      paymentProviderMode: "mock",
    });
  });

  it("rejects unknown payment provider and PayPal environment values", () => {
    expect(() =>
      validateRuntimeEnv({
        ...baseEnv,
        PAYMENTS_ENABLED: "true",
        PAYMENT_PROVIDER: "adyen",
      })
    ).toThrow(/PAYMENT_PROVIDER must be stripe, paypal, or mock/);

    expect(() =>
      validateRuntimeEnv({
        ...baseEnv,
        PAYMENTS_ENABLED: "true",
        ...paypalEnv,
        PAYPAL_ENV: "stage",
        PAYMENT_SUCCESS_URL: "http://localhost:3000/checkout/success",
        PAYMENT_CANCEL_URL: "http://localhost:3000/checkout/cancel",
      })
    ).toThrow(/PAYPAL_ENV must be sandbox or live/);
  });

  it("validates payment return URLs when payments are enabled", () => {
    expect(() =>
      validateRuntimeEnv({
        ...baseEnv,
        PAYMENTS_ENABLED: "true",
        ...paymentEnv,
        PAYMENT_SUCCESS_URL: "ftp://example.test/success",
        PAYMENT_CANCEL_URL: "not a url",
      })
    ).toThrow(/PAYMENT_SUCCESS_URL must use http or https/);
  });
});
