import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../app.js";

const rateLimitHeader = "X-Rate-Limit-Test";

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
});
