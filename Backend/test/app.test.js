import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../app.js";

describe("app", () => {
  it("responds to the health check without starting a listener", async () => {
    const response = await request(app).get("/api/health").expect(200);

    expect(response.body).toEqual({
      status: "ok",
      message: "PLASHOE API is running",
    });
  });
});
