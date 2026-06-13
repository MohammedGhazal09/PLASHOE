import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../app.js";
import { handleApplicationErrors } from "../middleware/security.js";
import Product from "../models/Product.js";
import { redact, serializeError } from "../utils/logger.js";

const rateLimitHeader = "X-Rate-Limit-Test";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("security middleware", () => {
  it("applies route-specific authentication rate limits with stable 429 envelopes", async () => {
    const key = `auth-${Date.now()}`;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app)
        .post("/api/auth/login")
        .set(rateLimitHeader, key)
        .send({ email: "missing@example.com", password: "wrong-password" })
        .expect(401);
    }

    const response = await request(app)
      .post("/api/auth/login")
      .set(rateLimitHeader, key)
      .send({ email: "missing@example.com", password: "wrong-password" })
      .expect(429);

    expect(response.body).toEqual({
      success: false,
      message: "Too many authentication attempts, please try again later",
    });
  });

  it("keeps ordinary requests under route limits flowing to controller behavior", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set(rateLimitHeader, `auth-normal-${Date.now()}`)
      .send({ email: "missing@example.com", password: "wrong-password" })
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid credentials",
    });
  });

  it("rejects oversized strict JSON bodies before contact controller persistence", async () => {
    const response = await request(app)
      .post("/api/contact")
      .send({
        name: "Oversized Sender",
        email: "oversized@example.com",
        subject: "Large payload",
        message: "x".repeat(10 * 1024),
      })
      .expect(413);

    expect(response.body).toEqual({
      success: false,
      message: "Request body too large",
    });
  });

  it("applies the global API limiter when tests explicitly opt in", async () => {
    const key = `global-${Date.now()}`;

    for (let attempt = 0; attempt < 300; attempt += 1) {
      await request(app).get("/api/health").set(rateLimitHeader, key).expect(200);
    }

    const response = await request(app)
      .get("/api/health")
      .set(rateLimitHeader, key)
      .expect(429);

    expect(response.body).toEqual({
      success: false,
      message: "Too many API requests, please try again later",
    });
  });

  it("hides unexpected 500 error details from client envelopes", () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = { status, json };

    handleApplicationErrors(
      new Error("MongoServerError: raw database detail"),
      { requestId: "req-error-direct" },
      res
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: "Server Error",
      requestId: "req-error-direct",
    });
  });

  it("hides controller-level unexpected error details from client envelopes", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Product, "find").mockImplementationOnce(() => {
      throw new Error("MongoServerError: leaked product collection detail");
    });

    const response = await request(app).get("/api/products").expect(500);

    expect(response.body).toMatchObject({
      success: false,
      message: "Server Error",
      requestId: response.headers["x-request-id"],
    });
    expect(response.text).not.toContain("leaked product collection detail");
    expect(consoleError).toHaveBeenCalled();
  });

  it("redacts sensitive values from structured metadata", () => {
    const redacted = redact({
      authorization: "Bearer abc.def.ghi",
      password: "plain-password",
      jwtSecret: "jwt-secret-with-at-least-32-characters",
      stripeSecret: "sk_test_123456789",
      webhookPayload: { id: "evt_123" },
      mongoUri: "mongodb+srv://user:pass@example.mongodb.net/plashoe",
      nested: {
        note: "Bearer abc.def.ghi",
      },
    });

    expect(redacted).toEqual({
      authorization: "[REDACTED]",
      password: "[REDACTED]",
      jwtSecret: "[REDACTED]",
      stripeSecret: "[REDACTED]",
      webhookPayload: "[REDACTED]",
      mongoUri: "[REDACTED]",
      nested: {
        note: "[REDACTED]",
      },
    });
  });

  it("serializes errors without stacks or secret-looking values", () => {
    const error = new Error("Failed mongodb+srv://user:pass@example.mongodb.net/plashoe");
    error.code = "MONGO_FAIL";
    error.status = 503;

    expect(serializeError(error)).toEqual({
      name: "Error",
      message: "Failed [REDACTED]",
      code: "MONGO_FAIL",
      status: 503,
    });
  });
});
