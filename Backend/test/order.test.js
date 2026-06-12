import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../app.js";
import Cart from "../models/Cart.js";
import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { createCheckoutFromCart } from "../services/checkoutService.js";
import { authHeader } from "./helpers/auth.js";
import {
  createCartForUser,
  createCoupon,
  createOrder,
  createProduct,
  createUser,
  validShippingAddress,
} from "./helpers/factories.js";

let idempotencySequence = 0;
const nextIdempotencyKey = () => `checkout-key-${++idempotencySequence}`;

const postCheckout = (user, idempotencyKey, body = {}) =>
  request(app)
    .post("/api/orders")
    .set(authHeader(user))
    .set("Idempotency-Key", idempotencyKey)
    .send({
      shippingAddress: validShippingAddress(),
      ...body,
    });

describe("order routes", () => {
  it("rejects order creation without a token", async () => {
    const response = await request(app)
      .post("/api/orders")
      .send({ shippingAddress: validShippingAddress() })
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      message: "Not authorized, no token",
    });
  });

  it("requires an idempotency header for checkout", async () => {
    const user = await createUser();
    await createCartForUser(user);

    const response = await request(app)
      .post("/api/orders")
      .set(authHeader(user))
      .send({ shippingAddress: validShippingAddress() })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Idempotency-Key header is required",
      errors: [
        {
          code: "IDEMPOTENCY_KEY_REQUIRED",
          resource: "checkout",
        },
      ],
    });
  });

  it("rejects order creation when the cart is empty", async () => {
    const user = await createUser();

    const response = await postCheckout(user, nextIdempotencyKey()).expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Cart is empty",
    });
  });

  it("rejects order creation when shipping fields are missing", async () => {
    const user = await createUser();
    await createCartForUser(user);
    const { phone, ...shippingAddress } = validShippingAddress();

    const response = await request(app)
      .post("/api/orders")
      .set(authHeader(user))
      .set("Idempotency-Key", nextIdempotencyKey())
      .send({ shippingAddress })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid request",
    });
  });

  it("creates an order from the cart, applies coupon totals, decrements stock, and clears the cart", async () => {
    const user = await createUser();
    const product = await createProduct({ stock: 10 });
    const coupon = await createCoupon({ code: "SAVE20", discountPercentage: 20 });
    await createCartForUser(user, [{ product, quantity: 2, size: 42 }], {
      couponCode: coupon.code,
      discount: coupon.discountPercentage,
    });

    const response = await postCheckout(user, nextIdempotencyKey(), {
      notes: "Leave at reception",
    }).expect(201);

    expect(response.body).toMatchObject({
      success: true,
      message: "Order placed successfully",
    });
    expect(response.body.data).toMatchObject({
      subtotal: 200,
      discount: 20,
      total: 160,
      couponCode: "SAVE20",
      status: "processing",
      notes: "Leave at reception",
    });
    expect(response.body.data.idempotencyKey).toBeTruthy();
    expect(response.body.data.cartFingerprint).toBeTruthy();
    expect(response.body.data.orderNumber).toMatch(/^PLS-/);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0]).toMatchObject({
      product: product._id.toString(),
      name: product.name,
      image: product.image,
      quantity: 2,
      size: 42,
      price: product.price.current,
    });

    const updatedCoupon = await Coupon.findById(coupon._id);
    expect(updatedCoupon.usedCount).toBe(1);

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(8);

    const cart = await Cart.findOne({ user: user._id });
    expect(cart.items).toHaveLength(0);
    expect(cart.couponCode).toBeUndefined();
    expect(cart.discount).toBe(0);
  });

  it("returns the existing order on exact retry without duplicate side effects", async () => {
    const user = await createUser();
    const product = await createProduct({ stock: 10 });
    const coupon = await createCoupon({ code: "RETRY20", discountPercentage: 20 });
    await createCartForUser(user, [{ product, quantity: 2, size: 42 }], {
      couponCode: coupon.code,
      discount: coupon.discountPercentage,
    });
    const idempotencyKey = nextIdempotencyKey();
    const body = {
      shippingAddress: validShippingAddress(),
      notes: "Same attempt",
    };

    const first = await postCheckout(user, idempotencyKey, body).expect(201);
    const second = await postCheckout(user, idempotencyKey, body).expect(200);

    expect(second.body).toMatchObject({
      success: true,
      message: "Order already placed",
    });
    expect(second.body.data._id).toBe(first.body.data._id);
    expect(await Order.countDocuments({ user: user._id })).toBe(1);
    expect((await Coupon.findById(coupon._id)).usedCount).toBe(1);
    expect((await Product.findById(product._id)).stock).toBe(8);
  });

  it("rejects stale idempotency-key reuse for a changed non-empty cart", async () => {
    const user = await createUser();
    const product = await createProduct({ stock: 10 });
    await createCartForUser(user, [{ product, quantity: 1, size: 42 }]);
    const idempotencyKey = nextIdempotencyKey();

    await postCheckout(user, idempotencyKey).expect(201);

    const newProduct = await createProduct({ stock: 10 });
    const cart = await Cart.findOne({ user: user._id });
    cart.items.push({
      product: newProduct._id,
      quantity: 1,
      size: 43,
      priceAtAdd: newProduct.price.current,
    });
    await cart.save();

    const response = await postCheckout(user, idempotencyKey).expect(409);

    expect(response.body).toMatchObject({
      success: false,
      message: "Idempotency key was already used for a different checkout state",
      errors: [
        {
          code: "IDEMPOTENCY_KEY_CONFLICT",
          resource: "checkout",
          checkoutAttempt: idempotencyKey,
        },
      ],
    });
    expect(await Order.countDocuments({ user: user._id })).toBe(1);
  });

  it("rejects insufficient checkout stock without creating an order or clearing the cart", async () => {
    const user = await createUser();
    const product = await createProduct({ stock: 1 });
    const coupon = await createCoupon({ code: "LOWSTOCK", discountPercentage: 10 });
    await createCartForUser(user, [{ product, quantity: 2, size: 42 }], {
      couponCode: coupon.code,
      discount: coupon.discountPercentage,
    });

    const response = await postCheckout(user, nextIdempotencyKey()).expect(409);

    expect(response.body).toMatchObject({
      success: false,
      message: "Insufficient stock for one or more cart items",
      errors: [
        {
          code: "INSUFFICIENT_STOCK",
          resource: "product",
          productId: product._id.toString(),
          requested: 2,
          available: 1,
        },
      ],
    });
    expect(await Order.countDocuments({ user: user._id })).toBe(0);
    expect((await Product.findById(product._id)).stock).toBe(1);
    expect((await Coupon.findById(coupon._id)).usedCount).toBe(0);
    expect((await Cart.findOne({ user: user._id })).items).toHaveLength(1);
  });

  it("rejects checkout when a cart product was deleted", async () => {
    const user = await createUser();
    const product = await createProduct({ stock: 5 });
    await createCartForUser(user, [{ product, quantity: 1, size: 42 }]);
    await Product.deleteOne({ _id: product._id });

    const response = await postCheckout(user, nextIdempotencyKey()).expect(409);

    expect(response.body).toMatchObject({
      success: false,
      message: "A cart item is no longer available",
      errors: [
        {
          code: "PRODUCT_UNAVAILABLE",
          resource: "product",
          requested: 1,
          available: 0,
        },
      ],
    });
    expect(await Order.countDocuments({ user: user._id })).toBe(0);
    expect((await Cart.findOne({ user: user._id })).items).toHaveLength(1);
  });

  it("rejects checkout when a coupon is already at its usage limit", async () => {
    const user = await createUser();
    const product = await createProduct({ stock: 5 });
    const coupon = await createCoupon({
      code: "USEDUP",
      discountPercentage: 10,
      maxUses: 1,
      usedCount: 1,
    });
    await createCartForUser(user, [{ product, quantity: 1, size: 42 }], {
      couponCode: coupon.code,
      discount: coupon.discountPercentage,
    });

    const response = await postCheckout(user, nextIdempotencyKey()).expect(409);

    expect(response.body).toMatchObject({
      success: false,
      message: "Coupon is not valid or has reached its usage limit",
      errors: [
        {
          code: "COUPON_USAGE_LIMIT_REACHED",
          resource: "coupon",
          couponCode: "USEDUP",
        },
      ],
    });
    expect(await Order.countDocuments({ user: user._id })).toBe(0);
    expect((await Coupon.findById(coupon._id)).usedCount).toBe(1);
    expect((await Product.findById(product._id)).stock).toBe(5);
    expect((await Cart.findOne({ user: user._id })).items).toHaveLength(1);
  });

  it("does not let concurrent checkouts exceed a one-use coupon", async () => {
    const coupon = await createCoupon({
      code: "ONCEONLY",
      discountPercentage: 10,
      maxUses: 1,
    });
    const product = await createProduct({ stock: 10 });
    const firstUser = await createUser();
    const secondUser = await createUser();
    await createCartForUser(firstUser, [{ product, quantity: 1, size: 42 }], {
      couponCode: coupon.code,
      discount: coupon.discountPercentage,
    });
    await createCartForUser(secondUser, [{ product, quantity: 1, size: 43 }], {
      couponCode: coupon.code,
      discount: coupon.discountPercentage,
    });

    const responses = await Promise.all([
      postCheckout(firstUser, nextIdempotencyKey()),
      postCheckout(secondUser, nextIdempotencyKey()),
    ]);

    const statuses = responses.map((response) => response.status).sort();
    expect(statuses).toEqual([201, 409]);
    expect(await Order.countDocuments()).toBe(1);
    expect((await Coupon.findById(coupon._id)).usedCount).toBe(1);
  });

  for (const hookName of [
    "afterStockDecrement",
    "afterCouponIncrement",
    "afterOrderCreate",
    "afterCartClear",
  ]) {
    it(`rolls back checkout state when ${hookName} fails`, async () => {
      const user = await createUser();
      const product = await createProduct({ stock: 5 });
      const coupon = await createCoupon({
        code: `FAIL${hookName.length}`,
        discountPercentage: 10,
      });
      await createCartForUser(user, [{ product, quantity: 2, size: 42 }], {
        couponCode: coupon.code,
        discount: coupon.discountPercentage,
      });

      await expect(
        createCheckoutFromCart({
          userId: user._id,
          shippingAddress: validShippingAddress(),
          idempotencyKey: nextIdempotencyKey(),
          hooks: {
            [hookName]: async () => {
              throw new Error(`forced failure at ${hookName}`);
            },
          },
        })
      ).rejects.toThrow(`forced failure at ${hookName}`);

      expect(await Order.countDocuments({ user: user._id })).toBe(0);
      expect((await Product.findById(product._id)).stock).toBe(5);
      expect((await Coupon.findById(coupon._id)).usedCount).toBe(0);
      const cart = await Cart.findOne({ user: user._id });
      expect(cart.items).toHaveLength(1);
      expect(cart.couponCode).toBe(coupon.code);
      expect(cart.discount).toBe(coupon.discountPercentage);
    });
  }

  it("cancels a processing order, restores stock once, and treats repeated cancellation as idempotent", async () => {
    const user = await createUser();
    const product = await createProduct({ stock: 5 });
    const order = await createOrder(user, {
      items: [
        {
          product: product._id,
          name: product.name,
          image: product.image,
          quantity: 2,
          size: 42,
          price: product.price.current,
        },
      ],
      subtotal: 200,
      total: 200,
      status: "processing",
    });

    const first = await request(app)
      .put(`/api/orders/${order._id}/cancel`)
      .set(authHeader(user))
      .expect(200);

    expect(first.body).toMatchObject({
      success: true,
      message: "Order cancelled",
    });
    expect(first.body.data.status).toBe("cancelled");
    expect((await Product.findById(product._id)).stock).toBe(7);

    await request(app)
      .put(`/api/orders/${order._id}/cancel`)
      .set(authHeader(user))
      .expect(200);

    expect((await Product.findById(product._id)).stock).toBe(7);
  });

  it("keeps shipped cancellation rejected and unauthorized cancellation forbidden", async () => {
    const owner = await createUser();
    const otherUser = await createUser();
    const product = await createProduct({ stock: 5 });
    const order = await createOrder(owner, {
      items: [
        {
          product: product._id,
          name: product.name,
          image: product.image,
          quantity: 1,
          size: 42,
          price: product.price.current,
        },
      ],
      status: "shipped",
    });

    await request(app)
      .put(`/api/orders/${order._id}/cancel`)
      .set(authHeader(otherUser))
      .expect(403);

    const response = await request(app)
      .put(`/api/orders/${order._id}/cancel`)
      .set(authHeader(owner))
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Cannot cancel order that has been shipped or delivered",
    });
    expect((await Product.findById(product._id)).stock).toBe(5);
  });

  it("generates unique PLS order numbers during concurrent order creation", async () => {
    const user = await createUser();

    const orders = await Promise.all(
      Array.from({ length: 12 }, () => createOrder(user))
    );

    const orderNumbers = orders.map((order) => order.orderNumber);
    expect(orderNumbers.every((orderNumber) => /^PLS-/.test(orderNumber))).toBe(
      true
    );
    expect(new Set(orderNumbers).size).toBe(orderNumbers.length);
  });

  it("rejects invalid object ids before hitting cancellation logic", async () => {
    const user = await createUser();

    const response = await request(app)
      .put(`/api/orders/${new mongoose.Types.ObjectId().toString()}/cancel`)
      .set(authHeader(user))
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: "Order not found",
    });
  });
});
