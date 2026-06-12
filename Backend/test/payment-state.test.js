import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import PaymentEvent from "../models/PaymentEvent.js";
import Product from "../models/Product.js";
import { transitionOrderPaymentState } from "../services/paymentState.js";
import {
  createOrder,
  createProduct,
  createProviderBackedOrder,
  createUser,
} from "./helpers/factories.js";

describe("payment state model and transitions", () => {
  it("serializes legacy orders with not_required payment status", async () => {
    const user = await createUser();
    const order = await createOrder(user, { paymentStatus: undefined });

    const storedOrder = await Order.findById(order._id);

    expect(storedOrder.paymentStatus).toBe("not_required");
    expect(storedOrder.toJSON().paymentStatus).toBe("not_required");
  });

  it("persists provider-backed pending payment fields independently from fulfillment status", async () => {
    const user = await createUser();
    const order = await createProviderBackedOrder(user, {
      paymentProviderIntentId: "pi-placeholder",
      paymentProviderCustomerId: "customer-placeholder",
    });

    const storedOrder = await Order.findById(order._id);

    expect(storedOrder).toMatchObject({
      status: "pending",
      paymentStatus: "payment_pending",
      paymentProvider: "stripe",
      paymentProviderSessionId: expect.any(String),
      paymentProviderIntentId: "pi-placeholder",
      paymentProviderCustomerId: "customer-placeholder",
      paymentCheckoutUrl: "https://checkout.example.test/session",
      inventoryDecremented: true,
    });
  });

  it("rejects duplicate provider event ids for the same provider", async () => {
    const user = await createUser();
    const order = await createProviderBackedOrder(user);

    await PaymentEvent.create({
      provider: "stripe",
      providerEventId: "event-duplicate",
      eventType: "payment_intent.succeeded",
      order: order._id,
      status: "processed",
      processedAt: new Date(),
    });

    await expect(
      PaymentEvent.create({
        provider: "stripe",
        providerEventId: "event-duplicate",
        eventType: "payment_intent.succeeded",
        order: order._id,
        status: "processed",
        processedAt: new Date(),
      })
    ).rejects.toMatchObject({ code: 11000 });
  });

  it("marks paid orders as fulfillment processing and records paidAt", async () => {
    const user = await createUser();
    const order = await createProviderBackedOrder(user);

    const updatedOrder = await transitionOrderPaymentState({
      orderId: order._id,
      targetStatus: "paid",
      providerIntentId: "intent-placeholder",
    });

    expect(updatedOrder.paymentStatus).toBe("paid");
    expect(updatedOrder.status).toBe("processing");
    expect(updatedOrder.paymentProviderIntentId).toBe("intent-placeholder");
    expect(updatedOrder.paidAt).toBeInstanceOf(Date);
  });

  it("restores inventory exactly once for failed payment transitions", async () => {
    const user = await createUser();
    const product = await createProduct({ stock: 3 });
    const order = await createProviderBackedOrder(user, {
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
      inventoryDecremented: true,
    });

    await transitionOrderPaymentState({
      orderId: order._id,
      targetStatus: "payment_failed",
      providerIntentId: "intent-placeholder",
      failureReason: "card_declined",
    });
    await transitionOrderPaymentState({
      orderId: order._id,
      targetStatus: "payment_failed",
      providerIntentId: "intent-placeholder",
      failureReason: "card_declined",
    });

    const updatedProduct = await Product.findById(product._id);
    const updatedOrder = await Order.findById(order._id);

    expect(updatedProduct.stock).toBe(5);
    expect(updatedOrder.paymentStatus).toBe("payment_failed");
    expect(updatedOrder.paymentFailureReason).toBe("card_declined");
    expect(updatedOrder.inventoryDecremented).toBe(false);
    expect(updatedOrder.status).toBe("pending");
  });

  it("records full and partial refunds without restoring inventory", async () => {
    const user = await createUser();
    const order = await createProviderBackedOrder(user, {
      paymentStatus: "paid",
      status: "processing",
      inventoryDecremented: false,
    });

    const partial = await transitionOrderPaymentState({
      orderId: order._id,
      targetStatus: "partially_refunded",
      refundAmount: 40,
    });
    const full = await transitionOrderPaymentState({
      orderId: order._id,
      targetStatus: "refunded",
      refundAmount: 100,
    });

    expect(partial.paymentStatus).toBe("partially_refunded");
    expect(full.paymentStatus).toBe("refunded");
    expect(full.refundAmount).toBe(100);
    expect(full.refundedAt).toBeInstanceOf(Date);
  });

  it("rejects unknown payment status transitions", async () => {
    await expect(
      transitionOrderPaymentState({
        orderId: new mongoose.Types.ObjectId(),
        targetStatus: "not_real",
      })
    ).rejects.toThrow(/Unsupported payment status transition/);
  });
});
