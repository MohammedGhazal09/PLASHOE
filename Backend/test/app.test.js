import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../app.js";
import * as readiness from "../utils/readiness.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("app", () => {
  it("responds to the health check without starting a listener", async () => {
    const response = await request(app).get("/api/health").expect(200);

    expect(response.body).toEqual({
      status: "ok",
      message: "PLASHOE API is running",
    });
  });

  it("returns dependency readiness when MongoDB is connected", async () => {
    const response = await request(app).get("/api/ready").expect(200);

    expect(response.body).toEqual({
      status: "ready",
      ready: true,
      dependencies: {
        mongodb: {
          status: "ready",
          state: "connected",
        },
      },
    });
  });

  it("returns sanitized readiness failure details when MongoDB is not ready", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(readiness, "getReadinessStatus").mockReturnValue({
      status: "not_ready",
      ready: false,
      dependencies: {
        mongodb: {
          status: "not_ready",
          state: "disconnected",
        },
      },
    });

    const response = await request(app).get("/api/ready").expect(503);

    expect(response.body).toEqual({
      status: "not_ready",
      ready: false,
      dependencies: {
        mongodb: {
          status: "not_ready",
          state: "disconnected",
        },
      },
    });
    expect(response.text).not.toMatch(/MONGO_URI|mongodb\+srv:\/\/|stripe|jwt|password/i);
  });

  it("generates and echoes a request id", async () => {
    const response = await request(app).get("/api/health").expect(200);

    expect(response.headers["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it("honors safe inbound request ids", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("X-Request-Id", "checkout-smoke-123")
      .expect(200);

    expect(response.headers["x-request-id"]).toBe("checkout-smoke-123");
  });

  it("rejects unsafe inbound request ids and generates a replacement", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("X-Request-Id", "bad request id with spaces")
      .expect(200);

    expect(response.headers["x-request-id"]).not.toBe("bad request id with spaces");
    expect(response.headers["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });
});
