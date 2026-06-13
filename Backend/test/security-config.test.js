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

describe("runtime configuration validation", () => {
  it("accepts valid runtime configuration", () => {
    expect(validateRuntimeEnv({ ...baseEnv, PAYMENTS_ENABLED: "false" })).toMatchObject({
      mongoUri: baseEnv.MONGO_URI,
      jwtSecret: baseEnv.JWT_SECRET,
      jwtExpire: "1h",
      frontendUrl: "http://localhost:3000",
      port: 5000,
      paymentsEnabled: false,
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
    });
  });

  it("requires Stripe and return URL config when payments are enabled", () => {
    expect(() => validateRuntimeEnv({ ...baseEnv, PAYMENTS_ENABLED: "true" })).toThrow(
      /STRIPE_SECRET_KEY is required/
    );
    expect(() => validateRuntimeEnv({ ...baseEnv, NODE_ENV: "production" })).toThrow(
      /STRIPE_SECRET_KEY is required/
    );
    expect(() =>
      validateRuntimeEnv({
        ...baseEnv,
        PAYMENTS_ENABLED: "true",
        STRIPE_SECRET_KEY: paymentEnv.STRIPE_SECRET_KEY,
      })
    ).toThrow(/STRIPE_WEBHOOK_SECRET is required/);
    expect(() =>
      validateRuntimeEnv({
        ...baseEnv,
        PAYMENTS_ENABLED: "true",
        ...paymentEnv,
      })
    ).toThrow(/PAYMENT_SUCCESS_URL is required/);
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
