import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { validateRequest } from "../middleware/validate.js";

describe("request validation middleware", () => {
  it("returns stable 400 envelopes for invalid input", () => {
    const middleware = validateRequest({
      body: z.object({ name: z.string().trim().min(1) }).strict(),
    });
    const req = { body: { name: "", unexpected: true } };
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const next = vi.fn();

    middleware(req, { status, json }, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Invalid request",
        errors: expect.any(Array),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("stores sanitized request values and preserves successful flow", () => {
    const middleware = validateRequest({
      body: z.object({ name: z.string().trim() }).strict(),
      query: z.object({ limit: z.coerce.number().int().max(100) }).strict(),
    });
    const req = {
      body: { name: "  Buyer  " },
      query: { limit: "25" },
    };
    const next = vi.fn();

    middleware(req, {}, next);

    expect(req.validated).toEqual({
      body: { name: "Buyer" },
      query: { limit: 25 },
    });
    expect(req.body).toEqual({ name: "Buyer" });
    expect(req.query).toEqual({ limit: 25 });
    expect(next).toHaveBeenCalledOnce();
  });
});
