import { createHmac } from "node:crypto";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../app.js";
import Order from "../models/Order.js";
import PaymentEvent from "../models/PaymentEvent.js";
import Product from "../models/Product.js";
import {
  resetPaymentProviderOverride,
  setPaymentProviderOverride,
} from "../services/paymentProvider.js";
import {
  createProduct,
  createProviderBackedOrder,
  createUser,
} from "./helpers/factories.js";

const signPayload = (payload, timestamp = Math.floor(Date.now() / 1000)) => {
  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET || "stripe-webhook-secret-placeholder";
  const signature = createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  return `t=${timestamp},v1=${signature}`;
};

const postEvent = (event, signatureOverride) => {
  const payload = JSON.stringify(event);

  return request(app)
    .post("/api/webhooks/stripe")
    .set("Content-Type", "application/json")
    .set("Stripe-Signature", signatureOverride || signPayload(payload))
    .send(payload);
};

const captureStructuredLogs = () => {
  const records = [];
  const capture = (line) => {
    try {
      records.push(JSON.parse(String(line)));
    } catch {
      // Ignore non-JSON console output from unexpected test helpers.
    }
  };

  vi.spyOn(console, "log").mockImplementation(capture);
  vi.spyOn(console, "warn").mockImplementation(capture);
  vi.spyOn(console, "error").mockImplementation(capture);

  return records;
};

const findLogRecord = (records, event) =>
  records.find((record) => record.event === event);

const stripeEvent = (overrides = {}) => ({
  id: overrides.id || `event-${Date.now()}-${Math.random()}`,
  object: "event",
  type: overrides.type || "payment_intent.succeeded",
  data: {
    object: overrides.object,
  },
});

const createInventoryBackedPaymentOrder = async () => {
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
    paymentProviderIntentId: "intent-existing",
  });

  return { product, order };
};

afterEach(() => {
  resetPaymentProviderOverride();
  vi.restoreAllMocks();
});

describe("Stripe webhook route", () => {
  it("rejects invalid signatures without creating a payment event", async () => {
    const event = stripeEvent({
      id: "event-invalid-signature",
      object: {
        id: "intent-invalid",
        object: "payment_intent",
        metadata: {},
      },
    });

    const records = captureStructuredLogs();
    const invalidSignature = "t=1,v1=invalid";

    await postEvent(event, invalidSignature).expect(400);

    expect(await PaymentEvent.countDocuments()).toBe(0);

    const logRecord = findLogRecord(records, "stripe-webhook-invalid-signature");
    expect(logRecord).toMatchObject({
      level: "warn",
      event: "stripe-webhook-invalid-signature",
      requestId: expect.any(String),
      signaturePresent: true,
    });
    expect(JSON.stringify(logRecord)).not.toContain(invalidSignature);
    expect(JSON.stringify(logRecord)).not.toContain("event-invalid-signature");
  });

  it("marks payment intent success as paid and fulfillment processing", async () => {
    const { order } = await createInventoryBackedPaymentOrder();
    const records = captureStructuredLogs();
    const event = stripeEvent({
      id: "event-payment-success",
      type: "payment_intent.succeeded",
      object: {
        id: "intent-paid",
        object: "payment_intent",
        customer: "customer-placeholder",
        metadata: { orderId: order._id.toString() },
      },
    });

    const response = await postEvent(event).expect(200);

    expect(response.body).toMatchObject({
      success: true,
      message: "Webhook accepted",
    });
    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.paymentStatus).toBe("paid");
    expect(updatedOrder.status).toBe("processing");
    expect(updatedOrder.paymentProviderIntentId).toBe("intent-paid");
    expect(updatedOrder.paidAt).toBeInstanceOf(Date);
    expect(await PaymentEvent.countDocuments({ providerEventId: "event-payment-success" })).toBe(1);

    expect(findLogRecord(records, "stripe-webhook-accepted")).toMatchObject({
      level: "info",
      event: "stripe-webhook-accepted",
      requestId: expect.any(String),
      eventId: "event-payment-success",
      eventType: "payment_intent.succeeded",
      status: "processed",
      duplicate: false,
    });
  });

  it("restores inventory once for duplicate failed payment events", async () => {
    const { product, order } = await createInventoryBackedPaymentOrder();
    const event = stripeEvent({
      id: "event-payment-failed",
      type: "payment_intent.payment_failed",
      object: {
        id: "intent-failed",
        object: "payment_intent",
        last_payment_error: { code: "card_declined" },
        metadata: { orderId: order._id.toString() },
      },
    });

    await postEvent(event).expect(200);
    const records = captureStructuredLogs();
    await postEvent(event).expect(200);

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.paymentStatus).toBe("payment_failed");
    expect(updatedOrder.paymentFailureReason).toBe("card_declined");
    expect(updatedOrder.inventoryDecremented).toBe(false);
    expect((await Product.findById(product._id)).stock).toBe(5);
    expect(await PaymentEvent.countDocuments({ providerEventId: "event-payment-failed" })).toBe(1);
    expect(findLogRecord(records, "stripe-webhook-duplicate")).toMatchObject({
      level: "info",
      event: "stripe-webhook-duplicate",
      requestId: expect.any(String),
      eventId: "event-payment-failed",
      eventType: "payment_intent.payment_failed",
      status: "processed",
      duplicate: true,
    });
  });

  it("claims concurrent duplicate failed payment events before restoring inventory", async () => {
    const { product, order } = await createInventoryBackedPaymentOrder();
    const event = stripeEvent({
      id: "event-payment-failed-concurrent",
      type: "payment_intent.payment_failed",
      object: {
        id: "intent-failed-concurrent",
        object: "payment_intent",
        last_payment_error: { code: "card_declined" },
        metadata: { orderId: order._id.toString() },
      },
    });

    const responses = await Promise.all([postEvent(event), postEvent(event)]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 200]);
    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.paymentStatus).toBe("payment_failed");
    expect(updatedOrder.inventoryDecremented).toBe(false);
    expect((await Product.findById(product._id)).stock).toBe(5);
    expect(await PaymentEvent.countDocuments({ providerEventId: "event-payment-failed-concurrent" })).toBe(1);
    expect(await PaymentEvent.findOne({ providerEventId: "event-payment-failed-concurrent" })).toMatchObject({
      status: "processed",
    });
  });

  it("marks expired checkout sessions as payment canceled and restores inventory", async () => {
    const { product, order } = await createInventoryBackedPaymentOrder();
    const event = stripeEvent({
      id: "event-session-expired",
      type: "checkout.session.expired",
      object: {
        id: "session-expired",
        object: "checkout.session",
        payment_intent: "intent-expired",
        metadata: { orderId: order._id.toString() },
      },
    });

    await postEvent(event).expect(200);

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.paymentStatus).toBe("payment_canceled");
    expect(updatedOrder.status).toBe("cancelled");
    expect(updatedOrder.inventoryDecremented).toBe(false);
    expect((await Product.findById(product._id)).stock).toBe(5);
  });

  it("returns a retryable failure when an event cannot be resolved", async () => {
    const event = stripeEvent({
      id: "event-unresolved",
      type: "payment_intent.succeeded",
      object: {
        id: "intent-missing",
        object: "payment_intent",
        metadata: {},
      },
    });

    const records = captureStructuredLogs();

    await postEvent(event).expect(500);

    expect(await PaymentEvent.findOne({ providerEventId: "event-unresolved" })).toMatchObject({
      status: "failed",
      error: "Webhook event could not be reconciled to a local order",
    });

    const logRecord = findLogRecord(records, "stripe-webhook-processing-failed");
    expect(logRecord).toMatchObject({
      level: "error",
      event: "stripe-webhook-processing-failed",
      requestId: expect.any(String),
      eventId: "event-unresolved",
      eventType: "payment_intent.succeeded",
      status: "failed",
      error: {
        name: "WebhookReconciliationError",
        message: "Webhook event could not be reconciled to a local order",
      },
    });

    const serializedRecord = JSON.stringify(logRecord);
    expect(serializedRecord).not.toContain("stack");
    expect(serializedRecord).not.toContain("Stripe-Signature");
    expect(serializedRecord).not.toContain(`whsec_${"value"}`);
    expect(serializedRecord).not.toContain(`sk_${"test"}_value`);
    expect(serializedRecord).not.toContain(`mongodb${"+srv"}://`);
    expect(serializedRecord).not.toContain(`Bearer${" "}`);
    expect(serializedRecord).not.toContain("intent-missing");
    expect(serializedRecord).not.toContain(JSON.stringify(event));
  });

  it("retrieves related payment intents when direct metadata is missing", async () => {
    const { order } = await createInventoryBackedPaymentOrder();
    const retrievePaymentIntent = vi.fn(async () => ({
      id: "intent-related",
      metadata: { orderId: order._id.toString() },
    }));
    setPaymentProviderOverride({ retrievePaymentIntent });
    const event = stripeEvent({
      id: "event-retrieve-intent",
      type: "charge.refunded",
      object: {
        id: "charge-without-metadata",
        object: "charge",
        payment_intent: "intent-related",
        amount: 20000,
        amount_refunded: 20000,
        metadata: {},
      },
    });

    await postEvent(event).expect(200);

    expect(retrievePaymentIntent).toHaveBeenCalledWith({ paymentIntentId: "intent-related" });
    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.paymentStatus).toBe("refunded");
    expect(updatedOrder.refundAmount).toBe(200);
  });

  it("records full and partial refunds and ignores duplicate refund events", async () => {
    const user = await createUser();
    const fullOrder = await createProviderBackedOrder(user, {
      paymentStatus: "paid",
      status: "processing",
      inventoryDecremented: false,
      total: 100,
    });
    const partialOrder = await createProviderBackedOrder(user, {
      paymentStatus: "paid",
      status: "processing",
      inventoryDecremented: false,
      total: 100,
    });
    const fullRefundEvent = stripeEvent({
      id: "event-full-refund",
      type: "charge.refunded",
      object: {
        id: "charge-full",
        object: "charge",
        amount: 10000,
        amount_refunded: 10000,
        metadata: { orderId: fullOrder._id.toString() },
      },
    });
    const partialRefundEvent = stripeEvent({
      id: "event-partial-refund",
      type: "refund.updated",
      object: {
        id: "refund-partial",
        object: "refund",
        amount: 2500,
        metadata: { orderId: partialOrder._id.toString() },
      },
    });

    await postEvent(fullRefundEvent).expect(200);
    await postEvent(partialRefundEvent).expect(200);
    await postEvent(partialRefundEvent).expect(200);

    const updatedFull = await Order.findById(fullOrder._id);
    const updatedPartial = await Order.findById(partialOrder._id);
    expect(updatedFull.paymentStatus).toBe("refunded");
    expect(updatedFull.refundAmount).toBe(100);
    expect(updatedFull.refundedAt).toBeInstanceOf(Date);
    expect(updatedPartial.paymentStatus).toBe("partially_refunded");
    expect(updatedPartial.refundAmount).toBe(25);
    expect(updatedPartial.refundedAt).toBeInstanceOf(Date);
    expect(updatedPartial.refundRecords).toHaveLength(1);
    expect(await PaymentEvent.countDocuments({ providerEventId: "event-partial-refund" })).toBe(1);
  });

  it("does not double-count repeated refund updates for the same refund object", async () => {
    const user = await createUser();
    const order = await createProviderBackedOrder(user, {
      paymentStatus: "paid",
      status: "processing",
      inventoryDecremented: false,
      total: 100,
    });
    const baseRefund = {
      id: "refund-repeat",
      object: "refund",
      amount: 2500,
      payment_intent: "intent-repeat",
      metadata: { orderId: order._id.toString() },
    };
    const firstUpdate = stripeEvent({
      id: "event-refund-repeat-1",
      type: "refund.updated",
      object: {
        ...baseRefund,
        status: "pending",
      },
    });
    const secondUpdate = stripeEvent({
      id: "event-refund-repeat-2",
      type: "refund.updated",
      object: {
        ...baseRefund,
        status: "succeeded",
      },
    });

    await postEvent(firstUpdate).expect(200);
    await postEvent(secondUpdate).expect(200);

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.paymentStatus).toBe("partially_refunded");
    expect(updatedOrder.refundAmount).toBe(25);
    expect(updatedOrder.refundRecords).toHaveLength(1);
    expect(updatedOrder.refundRecords[0]).toMatchObject({
      providerRefundId: "refund-repeat",
      amount: 25,
      status: "succeeded",
      providerEventId: "event-refund-repeat-2",
    });
    expect(await PaymentEvent.countDocuments({ providerEventId: /^event-refund-repeat-/ })).toBe(2);
  });
});
