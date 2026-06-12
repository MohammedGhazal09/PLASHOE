import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../app.js";
import Cart from "../models/Cart.js";
import Coupon from "../models/Coupon.js";
import { authHeader } from "./helpers/auth.js";
import {
  createCartForUser,
  createCoupon,
  createProduct,
  createUser,
  validShippingAddress,
} from "./helpers/factories.js";

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

  it("rejects order creation when the cart is empty", async () => {
    const user = await createUser();

    const response = await request(app)
      .post("/api/orders")
      .set(authHeader(user))
      .send({ shippingAddress: validShippingAddress() })
      .expect(400);

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
      .send({ shippingAddress })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "phone is required in shipping address",
    });
  });

  it("creates an order from the cart, applies coupon totals, and clears the cart", async () => {
    const user = await createUser();
    const product = await createProduct();
    const coupon = await createCoupon({ code: "SAVE20", discountPercentage: 20 });
    await createCartForUser(user, [{ product, quantity: 2, size: 42 }], {
      couponCode: coupon.code,
      discount: coupon.discountPercentage,
    });

    const response = await request(app)
      .post("/api/orders")
      .set(authHeader(user))
      .send({
        shippingAddress: validShippingAddress(),
        notes: "Leave at reception",
      })
      .expect(201);

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

    const cart = await Cart.findOne({ user: user._id });
    expect(cart.items).toHaveLength(0);
    expect(cart.couponCode).toBeUndefined();
    expect(cart.discount).toBe(0);
  });
});
