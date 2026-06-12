import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import request from "supertest";
import app from "../app.js";
import { validateRequest } from "../middleware/validate.js";
import { authHeader } from "./helpers/auth.js";
import { createCartForUser, createProduct, createUser } from "./helpers/factories.js";

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

  it("rejects unknown cart item fields before persistence", async () => {
    const user = await createUser();
    const product = await createProduct();

    const response = await request(app)
      .post("/api/cart/items")
      .set(authHeader(user))
      .send({
        productId: product._id.toString(),
        quantity: 1,
        size: 42,
        priceAtAdd: 1,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid request",
    });
  });

  it("rejects unknown contact fields before persistence", async () => {
    const response = await request(app)
      .post("/api/contact")
      .send({
        name: "Contact User",
        email: "contact@example.com",
        subject: "Sizing",
        message: "Question",
        isRead: true,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid request",
    });
  });

  it("rejects unknown order fields before persistence", async () => {
    const user = await createUser();
    await createCartForUser(user);

    const response = await request(app)
      .post("/api/orders")
      .set(authHeader(user))
      .send({
        shippingAddress: {
          firstName: "Test",
          lastName: "Buyer",
          country: "United States",
          street: "123 Test Street",
          city: "Testville",
          state: "CA",
          zipCode: "90210",
          phone: "5551234567",
        },
        notes: "Leave at reception",
        status: "delivered",
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid request",
    });
  });

  it("rejects unknown admin product fields before persistence", async () => {
    const admin = await createUser({ email: "admin-product@example.com", isAdmin: true });

    const response = await request(app)
      .post("/api/products")
      .set(authHeader(admin))
      .send({
        name: "Admin Shoe",
        gender: "male",
        category: "Running",
        image: "/images/admin-shoe.jpg",
        price: { original: 150, current: 120 },
        sizes: [40, 41, 42],
        stock: 10,
        hiddenCost: 1,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid request",
    });
  });

  it("rejects invalid product query parameters", async () => {
    const response = await request(app)
      .get("/api/products")
      .query({ sort: "expensive-first" })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid request",
    });
  });

  it("rejects product limits above the configured cap", async () => {
    const response = await request(app)
      .get("/api/products")
      .query({ limit: 101 })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid request",
    });
  });

  it("accepts valid product query parameters at the configured cap", async () => {
    await request(app)
      .get("/api/products")
      .query({ gender: "male", category: "Running", sale: "true", sort: "newest", page: 1, limit: 100 })
      .expect(200);
  });

  it("rejects malformed product ObjectId route params", async () => {
    const response = await request(app).get("/api/products/not-an-id").expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid request",
    });
  });
});
