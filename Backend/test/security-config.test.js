import { describe, expect, it } from "vitest";
import { validateRuntimeEnv } from "../config/env.js";

const baseEnv = {
  MONGO_URI: "mongodb://localhost:27017/plashoe-test",
  JWT_SECRET: "strong-test-secret-with-at-least-32-characters",
  FRONTEND_URL: "http://localhost:3000",
  JWT_EXPIRE: "1h",
  PORT: "5000",
};

describe("runtime configuration validation", () => {
  it("accepts valid runtime configuration", () => {
    expect(validateRuntimeEnv(baseEnv)).toMatchObject({
      mongoUri: baseEnv.MONGO_URI,
      jwtSecret: baseEnv.JWT_SECRET,
      jwtExpire: "1h",
      frontendUrl: "http://localhost:3000",
      port: 5000,
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
});
