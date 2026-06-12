import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../app.js";
import Cart from "../models/Cart.js";
import { authHeader } from "./helpers/auth.js";
import {
  createCartForUser,
  createCoupon,
  createProduct,
  createUser,
} from "./helpers/factories.js";

describe("cart routes", () => {
  it("rejects cart access without a token", async () => {
    const response = await request(app).get("/api/cart").expect(401);

    expect(response.body).toMatchObject({
      success: false,
      message: "Not authorized, no token",
    });
  });

  it("creates an empty cart for an authenticated user", async () => {
    const user = await createUser();

    const response = await request(app)
      .get("/api/cart")
      .set(authHeader(user))
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      user: user._id.toString(),
      items: [],
      discount: 0,
    });
  });

  it("adds a valid product and size to the cart", async () => {
    const user = await createUser();
    const product = await createProduct();

    const response = await request(app)
      .post("/api/cart/items")
      .set(authHeader(user))
      .send({
        productId: product._id.toString(),
        quantity: 2,
        size: 42,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0]).toMatchObject({
      quantity: 2,
      size: 42,
      priceAtAdd: product.price.current,
    });
    expect(response.body.data.items[0].product).toMatchObject({
      _id: product._id.toString(),
      name: product.name,
    });
  });

  it("rejects adding more than available stock without creating a cart", async () => {
    const user = await createUser();
    const product = await createProduct({ stock: 2 });

    const response = await request(app)
      .post("/api/cart/items")
      .set(authHeader(user))
      .send({
        productId: product._id.toString(),
        quantity: 3,
        size: 42,
      })
      .expect(409);

    expect(response.body).toMatchObject({
      success: false,
      message: "Requested quantity exceeds available stock",
      errors: [
        {
          code: "INSUFFICIENT_STOCK",
          resource: "product",
          productId: product._id.toString(),
          requested: 3,
          available: 2,
        },
      ],
    });

    const cart = await Cart.findOne({ user: user._id });
    expect(cart).toBeNull();
  });

  it("rejects duplicate cart additions above stock and leaves the item unchanged", async () => {
    const user = await createUser();
    const product = await createProduct({ stock: 3 });
    await createCartForUser(user, [{ product, quantity: 2, size: 42 }]);

    const response = await request(app)
      .post("/api/cart/items")
      .set(authHeader(user))
      .send({
        productId: product._id.toString(),
        quantity: 2,
        size: 42,
      })
      .expect(409);

    expect(response.body.errors[0]).toMatchObject({
      code: "INSUFFICIENT_STOCK",
      productId: product._id.toString(),
      requested: 4,
      available: 3,
    });

    const cart = await Cart.findOne({ user: user._id });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(2);
  });

  it("rejects an unknown product when adding items", async () => {
    const user = await createUser();

    const response = await request(app)
      .post("/api/cart/items")
      .set(authHeader(user))
      .send({
        productId: new mongoose.Types.ObjectId().toString(),
        quantity: 1,
        size: 42,
      })
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: "Product not found",
    });
  });

  it("rejects invalid cart item sizes", async () => {
    const user = await createUser();
    const product = await createProduct();

    const response = await request(app)
      .post("/api/cart/items")
      .set(authHeader(user))
      .send({
        productId: product._id.toString(),
        quantity: 1,
        size: 99,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid request",
    });
  });

  it("updates and removes persisted cart items", async () => {
    const user = await createUser();
    const product = await createProduct();
    const addResponse = await request(app)
      .post("/api/cart/items")
      .set(authHeader(user))
      .send({
        productId: product._id.toString(),
        quantity: 1,
        size: 42,
      })
      .expect(200);
    const itemId = addResponse.body.data.items[0]._id;

    const updateResponse = await request(app)
      .put(`/api/cart/items/${itemId}`)
      .set(authHeader(user))
      .send({ quantity: 4 })
      .expect(200);

    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.data.items[0].quantity).toBe(4);

    const deleteResponse = await request(app)
      .delete(`/api/cart/items/${itemId}`)
      .set(authHeader(user))
      .expect(200);

    expect(deleteResponse.body.success).toBe(true);
    expect(deleteResponse.body.data.items).toHaveLength(0);
  });

  it("rejects updating a cart item above stock and leaves quantity unchanged", async () => {
    const user = await createUser();
    const product = await createProduct({ stock: 3 });
    const cart = await createCartForUser(user, [{ product, quantity: 2, size: 42 }]);
    const itemId = cart.items[0]._id.toString();

    const response = await request(app)
      .put(`/api/cart/items/${itemId}`)
      .set(authHeader(user))
      .send({ quantity: 4 })
      .expect(409);

    expect(response.body).toMatchObject({
      success: false,
      message: "Requested quantity exceeds available stock",
      errors: [
        {
          code: "INSUFFICIENT_STOCK",
          resource: "product",
          productId: product._id.toString(),
          cartItemId: itemId,
          requested: 4,
          available: 3,
        },
      ],
    });

    const persistedCart = await Cart.findOne({ user: user._id });
    expect(persistedCart.items[0].quantity).toBe(2);
  });

  it("clears cart items and coupon state", async () => {
    const user = await createUser();
    const coupon = await createCoupon({ code: "CLEAR20" });
    await createCartForUser(user, [], {
      couponCode: coupon.code,
      discount: coupon.discountPercentage,
    });

    const response = await request(app)
      .delete("/api/cart")
      .set(authHeader(user))
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      message: "Cart cleared",
    });

    const cart = await Cart.findOne({ user: user._id });
    expect(cart.items).toHaveLength(0);
    expect(cart.couponCode).toBeUndefined();
    expect(cart.discount).toBe(0);
  });

  it("applies a valid coupon to an existing cart", async () => {
    const user = await createUser();
    const product = await createProduct();
    const coupon = await createCoupon({ code: "SAVE20", discountPercentage: 20 });
    await createCartForUser(user, [{ product, quantity: 2, size: 42 }]);

    const response = await request(app)
      .post("/api/cart/coupon")
      .set(authHeader(user))
      .send({ code: "save20" })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      message: "Coupon applied: 20% off",
    });
    expect(response.body.data).toMatchObject({
      couponCode: "SAVE20",
      discount: 20,
      subtotal: 200,
      total: 160,
    });
  });

  it("rejects an invalid coupon code", async () => {
    const user = await createUser();
    await createCartForUser(user);

    const response = await request(app)
      .post("/api/cart/coupon")
      .set(authHeader(user))
      .send({ code: "missing" })
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: "Coupon not found",
    });
  });

  it("rejects coupons when the cart is below the minimum order amount", async () => {
    const user = await createUser();
    const product = await createProduct();
    await createCartForUser(user, [{ product, quantity: 1, size: 42 }]);
    await createCoupon({
      code: "MIN250",
      discountPercentage: 25,
      minOrderAmount: 250,
    });

    const response = await request(app)
      .post("/api/cart/coupon")
      .set(authHeader(user))
      .send({ code: "MIN250" })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Minimum order amount is $250",
    });
  });

  it("removes a coupon safely when the user has no cart", async () => {
    const user = await createUser();

    const response = await request(app)
      .delete("/api/cart/coupon")
      .set(authHeader(user))
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: "Coupon removed",
      data: null,
    });
  });
});
