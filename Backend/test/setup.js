import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll } from "vitest";

let mongoReplSet;

process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test-jwt-secret-with-at-least-32-characters";
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || "1h";
process.env.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
process.env.PAYMENT_SUCCESS_URL =
  process.env.PAYMENT_SUCCESS_URL || "http://localhost:3000/checkout/success";
process.env.PAYMENT_CANCEL_URL =
  process.env.PAYMENT_CANCEL_URL || "http://localhost:3000/checkout/cancel";
process.env.PAYMENTS_ENABLED = process.env.PAYMENTS_ENABLED || "true";
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "stripe-secret-placeholder";
process.env.STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET || "stripe-webhook-secret-placeholder";
process.env.NODE_ENV = "test";

beforeAll(async () => {
  mongoReplSet = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: "wiredTiger",
    },
  });
  await mongoose.connect(mongoReplSet.getUri());
});

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);

  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();

  if (mongoReplSet) {
    await mongoReplSet.stop();
  }
});
