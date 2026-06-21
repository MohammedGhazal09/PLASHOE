import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../app.js";
import Wishlist from "../models/Wishlist.js";
import { authHeader } from "./helpers/auth.js";
import { createProduct, createUser, createWishlistForUser } from "./helpers/factories.js";

describe("wishlist routes", () => {
  it("rejects wishlist access without a token", async () => {
    await request(app).get("/api/wishlist").expect(401);
    await request(app)
      .post("/api/wishlist/items")
      .send({ productId: new mongoose.Types.ObjectId().toString() })
      .expect(401);
    await request(app)
      .delete(`/api/wishlist/items/${new mongoose.Types.ObjectId().toString()}`)
      .expect(401);
  });

  it("creates an empty wishlist envelope for an authenticated user", async () => {
    const user = await createUser();

    const response = await request(app)
      .get("/api/wishlist")
      .set(authHeader(user))
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      count: 0,
      total: 0,
      page: 1,
      limit: 20,
      pages: 1,
      data: [],
    });
  });

  it("adds and lists populated wishlist products", async () => {
    const user = await createUser();
    const product = await createProduct({
      name: "Wishlist Runner",
      category: "Running",
      gender: "male",
      isOnSale: true,
      sizes: [41, 42],
      stock: 12,
    });

    const addResponse = await request(app)
      .post("/api/wishlist/items")
      .set(authHeader(user))
      .send({ productId: product._id.toString() })
      .expect(200);

    expect(addResponse.body).toMatchObject({
      success: true,
      count: 1,
      total: 1,
      data: [
        {
          productId: product._id.toString(),
          product: {
            _id: product._id.toString(),
            name: "Wishlist Runner",
            category: "Running",
            gender: "male",
            isOnSale: true,
            stock: 12,
            sizes: [41, 42],
          },
        },
      ],
    });

    const listResponse = await request(app)
      .get("/api/wishlist")
      .query({ limit: 1, page: 1 })
      .set(authHeader(user))
      .expect(200);

    expect(listResponse.body).toMatchObject({
      success: true,
      count: 1,
      total: 1,
      page: 1,
      limit: 1,
      pages: 1,
    });
    expect(listResponse.body.data[0].product.name).toBe("Wishlist Runner");
  });

  it("keeps duplicate adds idempotent", async () => {
    const user = await createUser();
    const product = await createProduct();

    await request(app)
      .post("/api/wishlist/items")
      .set(authHeader(user))
      .send({ productId: product._id.toString() })
      .expect(200);

    const response = await request(app)
      .post("/api/wishlist/items")
      .set(authHeader(user))
      .send({ productId: product._id.toString() })
      .expect(200);

    expect(response.body.total).toBe(1);

    const wishlist = await Wishlist.findOne({ user: user._id });
    expect(wishlist.items).toHaveLength(1);
  });

  it("removes saved products and treats missing wishlist items as a no-op", async () => {
    const user = await createUser();
    const product = await createProduct();
    const otherProduct = await createProduct();
    await createWishlistForUser(user, [product]);

    const missingRemove = await request(app)
      .delete(`/api/wishlist/items/${otherProduct._id.toString()}`)
      .set(authHeader(user))
      .expect(200);

    expect(missingRemove.body.total).toBe(1);

    const removeResponse = await request(app)
      .delete(`/api/wishlist/items/${product._id.toString()}`)
      .set(authHeader(user))
      .expect(200);

    expect(removeResponse.body).toMatchObject({
      success: true,
      count: 0,
      total: 0,
      data: [],
    });
  });

  it("rejects invalid wishlist request fields before controller logic", async () => {
    const user = await createUser();

    await request(app)
      .post("/api/wishlist/items")
      .set(authHeader(user))
      .send({ productId: "not-an-id" })
      .expect(400);

    await request(app)
      .get("/api/wishlist")
      .query({ limit: 500 })
      .set(authHeader(user))
      .expect(400);

    await request(app)
      .delete("/api/wishlist/items/not-an-id")
      .set(authHeader(user))
      .expect(400);
  });

  it("returns 404 when adding a valid but nonexistent product id", async () => {
    const user = await createUser();

    const response = await request(app)
      .post("/api/wishlist/items")
      .set(authHeader(user))
      .send({ productId: new mongoose.Types.ObjectId().toString() })
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: "Product not found",
    });
  });
});

