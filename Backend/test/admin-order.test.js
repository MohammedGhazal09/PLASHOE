import mongoose from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { authHeader } from './helpers/auth.js';
import {
  createOrder,
  createUser,
  validShippingAddress,
} from './helpers/factories.js';

const adminOrdersPath = '/api/admin/orders';
const fulfillmentPath = (orderId) => `${adminOrdersPath}/${orderId}/fulfillment`;

const setCreatedAt = async (order, createdAt) =>
  Order.collection.updateOne(
    { _id: order._id },
    { $set: { createdAt, updatedAt: createdAt } }
  );

describe('admin order routes', () => {
  it('requires a token and admin role for admin order list and detail', async () => {
    const owner = await createUser();
    const customer = await createUser();
    const admin = await createUser({ isAdmin: true });
    const order = await createOrder(owner);

    await request(app).get(adminOrdersPath).expect(401);

    await request(app)
      .get(adminOrdersPath)
      .set(authHeader(customer))
      .expect(403);

    await request(app)
      .get(`${adminOrdersPath}/${order._id}`)
      .set(authHeader(customer))
      .expect(403);

    await request(app)
      .get(adminOrdersPath)
      .set(authHeader(admin))
      .expect(200);

    await request(app)
      .get(`${adminOrdersPath}/${order._id}`)
      .set(authHeader(admin))
      .expect(200);

    await request(app)
      .patch(fulfillmentPath(order._id))
      .send({ status: 'shipped', carrier: 'DHL', trackingNumber: 'TRACK1' })
      .expect(401);

    await request(app)
      .patch(fulfillmentPath(order._id))
      .set(authHeader(customer))
      .send({ status: 'shipped', carrier: 'DHL', trackingNumber: 'TRACK1' })
      .expect(403);
  });

  it('lists all matching orders with pagination metadata and compact rows', async () => {
    const firstUser = await createUser({
      name: 'Alice Runner',
      email: 'alice@example.com',
    });
    const secondUser = await createUser({
      name: 'Bob Walker',
      email: 'bob@example.com',
    });
    const admin = await createUser({ isAdmin: true });

    const matchingRecent = await createOrder(firstUser, {
      orderNumber: 'PLS-ADMIN-RECENT',
      status: 'processing',
      paymentStatus: 'paid',
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          name: 'Runner',
          image: '/runner.jpg',
          quantity: 2,
          size: 42,
          price: 90,
        },
      ],
      subtotal: 180,
      total: 180,
    });
    const matchingOlder = await createOrder(secondUser, {
      orderNumber: 'PLS-ADMIN-OLDER',
      status: 'processing',
      paymentStatus: 'paid',
    });
    const nonMatchingStatus = await createOrder(secondUser, {
      orderNumber: 'PLS-ADMIN-SHIPPED',
      status: 'shipped',
      paymentStatus: 'paid',
    });

    await setCreatedAt(matchingRecent, new Date('2026-06-10T12:00:00.000Z'));
    await setCreatedAt(matchingOlder, new Date('2026-06-09T12:00:00.000Z'));
    await setCreatedAt(nonMatchingStatus, new Date('2026-06-08T12:00:00.000Z'));

    const response = await request(app)
      .get(adminOrdersPath)
      .query({
        status: 'processing',
        paymentStatus: 'paid',
        limit: 1,
        page: 1,
      })
      .set(authHeader(admin))
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      count: 1,
      total: 2,
      page: 1,
      limit: 1,
      pages: 2,
    });
    expect(response.body.data[0]).toMatchObject({
      _id: matchingRecent._id.toString(),
      orderNumber: 'PLS-ADMIN-RECENT',
      status: 'processing',
      paymentStatus: 'paid',
      total: 180,
      itemCount: 2,
      user: {
        name: 'Alice Runner',
        email: 'alice@example.com',
      },
    });
    expect(response.body.data[0].items).toBeUndefined();
    expect(response.body.data[0].user.password).toBeUndefined();
  });

  it('filters admin order list by search text and created date range', async () => {
    const firstUser = await createUser({
      name: 'Searchable Customer',
      email: 'searchable@example.com',
    });
    const secondUser = await createUser({
      name: 'Outside Customer',
      email: 'outside@example.com',
    });
    const admin = await createUser({ isAdmin: true });

    const orderByNumber = await createOrder(firstUser, {
      orderNumber: 'PLS-FIND-ME',
      paymentStatus: 'not_required',
    });
    const orderByUser = await createOrder(firstUser, {
      orderNumber: 'PLS-USER-MATCH',
      paymentStatus: 'not_required',
    });
    const outsideWindow = await createOrder(firstUser, {
      orderNumber: 'PLS-OLD-SEARCHABLE',
      paymentStatus: 'not_required',
    });
    const nonMatch = await createOrder(secondUser, {
      orderNumber: 'PLS-OTHER',
      paymentStatus: 'not_required',
    });

    await setCreatedAt(orderByNumber, new Date('2026-06-10T12:00:00.000Z'));
    await setCreatedAt(orderByUser, new Date('2026-06-11T12:00:00.000Z'));
    await setCreatedAt(outsideWindow, new Date('2026-05-01T12:00:00.000Z'));
    await setCreatedAt(nonMatch, new Date('2026-06-10T12:00:00.000Z'));

    const byOrderNumber = await request(app)
      .get(adminOrdersPath)
      .query({ q: 'FIND-ME' })
      .set(authHeader(admin))
      .expect(200);

    expect(byOrderNumber.body.data.map((order) => order.orderNumber)).toEqual([
      'PLS-FIND-ME',
    ]);

    const byUserAndDate = await request(app)
      .get(adminOrdersPath)
      .query({
        q: 'searchable@example.com',
        createdFrom: '2026-06-01T00:00:00.000Z',
        createdTo: '2026-06-30T23:59:59.999Z',
      })
      .set(authHeader(admin))
      .expect(200);

    const orderNumbers = byUserAndDate.body.data.map((order) => order.orderNumber);
    expect(orderNumbers).toEqual(['PLS-USER-MATCH', 'PLS-FIND-ME']);
    expect(orderNumbers).not.toContain('PLS-OLD-SEARCHABLE');
    expect(orderNumbers).not.toContain('PLS-OTHER');
  });

  it('does not truncate admin order search matches after 50 matching users', async () => {
    const admin = await createUser({ isAdmin: true });
    const matchingUsers = await User.insertMany(
      Array.from({ length: 60 }, (_, index) => ({
        name: `Bulk Search Customer ${index}`,
        email: `bulk-search-${index}@bulk-match.example`,
        password: 'password123',
      }))
    );

    await Order.insertMany(
      matchingUsers.map((user, index) => ({
        user: user._id,
        orderNumber: `PLS-BULK-${String(index).padStart(2, '0')}`,
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            name: 'Bulk Runner',
            image: '/bulk-runner.jpg',
            quantity: 1,
            size: 42,
            price: 100,
          },
        ],
        shippingAddress: validShippingAddress(),
        subtotal: 100,
        total: 100,
        status: 'processing',
        paymentStatus: 'not_required',
      }))
    );

    const response = await request(app)
      .get(adminOrdersPath)
      .query({ q: 'bulk-match.example', limit: 100 })
      .set(authHeader(admin))
      .expect(200);

    const orderNumbers = response.body.data.map((order) => order.orderNumber);
    expect(response.body).toMatchObject({
      success: true,
      count: 60,
      total: 60,
      pages: 1,
    });
    expect(orderNumbers).toContain('PLS-BULK-00');
    expect(orderNumbers).toContain('PLS-BULK-59');
  });

  it('rejects invalid admin order query values and unknown query keys', async () => {
    const admin = await createUser({ isAdmin: true });

    await request(app)
      .get(adminOrdersPath)
      .query({ page: 0 })
      .set(authHeader(admin))
      .expect(400);

    await request(app)
      .get(adminOrdersPath)
      .query({ includeSecrets: 'true' })
      .set(authHeader(admin))
      .expect(400);
  });

  it('returns full admin order detail with limited user identity only', async () => {
    const owner = await createUser({
      name: 'Detail Customer',
      email: 'detail@example.com',
    });
    const admin = await createUser({ isAdmin: true });
    const order = await createOrder(owner, {
      orderNumber: 'PLS-DETAIL',
      carrier: 'DHL',
      trackingNumber: 'TRACK123',
    });

    const response = await request(app)
      .get(`${adminOrdersPath}/${order._id}`)
      .set(authHeader(admin))
      .expect(200);

    expect(response.body.data).toMatchObject({
      _id: order._id.toString(),
      orderNumber: 'PLS-DETAIL',
      carrier: 'DHL',
      trackingNumber: 'TRACK123',
      user: {
        name: 'Detail Customer',
        email: 'detail@example.com',
      },
    });
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.user.password).toBeUndefined();
    expect(response.body.data.user.addresses).toBeUndefined();
  });

  it('preserves customer order ownership boundaries on the customer endpoint', async () => {
    const owner = await createUser();
    const otherUser = await createUser();
    const order = await createOrder(owner);

    await request(app)
      .get(`/api/orders/${order._id}`)
      .set(authHeader(otherUser))
      .expect(403);
  });

  it('rejects malformed fulfillment bodies and client-owned tracking history fields', async () => {
    const owner = await createUser();
    const admin = await createUser({ isAdmin: true });
    const order = await createOrder(owner, {
      status: 'processing',
      paymentStatus: 'paid',
    });

    await request(app)
      .patch(fulfillmentPath(order._id))
      .set(authHeader(admin))
      .send({ status: 'cancelled' })
      .expect(400);

    const response = await request(app)
      .patch(fulfillmentPath(order._id))
      .set(authHeader(admin))
      .send({
        status: 'shipped',
        carrier: 'DHL',
        trackingNumber: 'TRACK1',
        trackingHistory: [{ status: 'delivered' }],
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Invalid request',
      errors: expect.any(Array),
    });
  });

  it('advances eligible paid orders from processing to shipped to delivered', async () => {
    const owner = await createUser();
    const admin = await createUser({ isAdmin: true });
    const order = await createOrder(owner, {
      status: 'processing',
      paymentStatus: 'paid',
    });

    const shipped = await request(app)
      .patch(fulfillmentPath(order._id))
      .set(authHeader(admin))
      .send({
        status: 'shipped',
        carrier: 'DHL',
        trackingNumber: 'TRACK-SHIP',
        estimatedDeliveryDate: '2026-06-20T00:00:00.000Z',
        description: 'Package handed to carrier',
        location: 'Warehouse',
      })
      .expect(200);

    expect(shipped.body).toMatchObject({
      success: true,
      message: 'Order marked as shipped',
    });
    expect(shipped.body.data).toMatchObject({
      status: 'shipped',
      paymentStatus: 'paid',
      carrier: 'DHL',
      trackingNumber: 'TRACK-SHIP',
    });
    expect(shipped.body.data.shippedAt).toEqual(expect.any(String));
    expect(shipped.body.data.trackingHistory).toHaveLength(1);
    expect(shipped.body.data.trackingHistory[0]).toMatchObject({
      status: 'shipped',
      description: 'Package handed to carrier',
      location: 'Warehouse',
    });
    expect(shipped.body.data.trackingHistory[0].timestamp).toEqual(expect.any(String));

    const delivered = await request(app)
      .patch(fulfillmentPath(order._id))
      .set(authHeader(admin))
      .send({
        status: 'delivered',
        description: 'Delivered to customer',
        location: 'Front door',
      })
      .expect(200);

    expect(delivered.body).toMatchObject({
      success: true,
      message: 'Order marked as delivered',
    });
    expect(delivered.body.data.status).toBe('delivered');
    expect(delivered.body.data.deliveredAt).toEqual(expect.any(String));
    expect(delivered.body.data.trackingHistory).toHaveLength(2);
    expect(delivered.body.data.trackingHistory[1]).toMatchObject({
      status: 'delivered',
      description: 'Delivered to customer',
      location: 'Front door',
    });
  });

  it('rejects invalid fulfillment transitions and missing orders with machine-readable errors', async () => {
    const owner = await createUser();
    const admin = await createUser({ isAdmin: true });
    const processingOrder = await createOrder(owner, {
      status: 'processing',
      paymentStatus: 'paid',
    });

    const skipped = await request(app)
      .patch(fulfillmentPath(processingOrder._id))
      .set(authHeader(admin))
      .send({ status: 'delivered' })
      .expect(409);

    expect(skipped.body.errors).toContainEqual(
      expect.objectContaining({ code: 'INVALID_FULFILLMENT_TRANSITION' })
    );

    const missing = await request(app)
      .patch(fulfillmentPath(new mongoose.Types.ObjectId().toString()))
      .set(authHeader(admin))
      .send({ status: 'shipped', carrier: 'DHL', trackingNumber: 'TRACK1' })
      .expect(404);

    expect(missing.body.errors).toContainEqual(
      expect.objectContaining({ code: 'ORDER_NOT_FOUND' })
    );
  });

  it('rejects shipment for non-shippable payment states', async () => {
    const owner = await createUser();
    const admin = await createUser({ isAdmin: true });

    for (const paymentStatus of [
      'requires_payment',
      'payment_pending',
      'payment_failed',
      'payment_canceled',
      'refunded',
      'partially_refunded',
    ]) {
      const order = await createOrder(owner, {
        status: paymentStatus === 'payment_canceled' ? 'cancelled' : 'processing',
        paymentStatus,
      });

      const response = await request(app)
        .patch(fulfillmentPath(order._id))
        .set(authHeader(admin))
        .send({ status: 'shipped', carrier: 'DHL', trackingNumber: `TRACK-${paymentStatus}` })
        .expect(409);

      expect(response.body.errors).toContainEqual(
        expect.objectContaining({ code: 'PAYMENT_NOT_SHIPPABLE' })
      );
    }
  });

  it('requires tracking fields for shipment and complete shipment fields before delivery', async () => {
    const owner = await createUser();
    const admin = await createUser({ isAdmin: true });
    const processingOrder = await createOrder(owner, {
      status: 'processing',
      paymentStatus: 'paid',
    });
    const shippedWithoutTracking = await createOrder(owner, {
      status: 'shipped',
      paymentStatus: 'paid',
      carrier: null,
      trackingNumber: null,
    });

    const missingTracking = await request(app)
      .patch(fulfillmentPath(processingOrder._id))
      .set(authHeader(admin))
      .send({ status: 'shipped', carrier: 'DHL' })
      .expect(409);

    expect(missingTracking.body.errors).toContainEqual(
      expect.objectContaining({ code: 'TRACKING_REQUIRED' })
    );

    const missingExistingTracking = await request(app)
      .patch(fulfillmentPath(shippedWithoutTracking._id))
      .set(authHeader(admin))
      .send({ status: 'delivered' })
      .expect(409);

    expect(missingExistingTracking.body.errors).toContainEqual(
      expect.objectContaining({ code: 'TRACKING_REQUIRED' })
    );
  });

  it('treats identical shipped retries as no-ops and appends one correction event when tracking changes', async () => {
    const owner = await createUser();
    const admin = await createUser({ isAdmin: true });
    const order = await createOrder(owner, {
      status: 'processing',
      paymentStatus: 'not_required',
    });
    const payload = {
      status: 'shipped',
      carrier: 'DHL',
      trackingNumber: 'TRACK-INITIAL',
      estimatedDeliveryDate: '2026-06-20T00:00:00.000Z',
      description: 'Carrier scan',
      location: 'Warehouse',
    };

    const first = await request(app)
      .patch(fulfillmentPath(order._id))
      .set(authHeader(admin))
      .send(payload)
      .expect(200);

    const retry = await request(app)
      .patch(fulfillmentPath(order._id))
      .set(authHeader(admin))
      .send(payload)
      .expect(200);

    expect(retry.body).toMatchObject({
      success: true,
      message: 'Fulfillment update already applied',
    });
    expect(retry.body.data.trackingHistory).toHaveLength(
      first.body.data.trackingHistory.length
    );

    const correction = await request(app)
      .patch(fulfillmentPath(order._id))
      .set(authHeader(admin))
      .send({
        ...payload,
        trackingNumber: 'TRACK-CORRECTED',
        description: 'Tracking number corrected',
      })
      .expect(200);

    expect(correction.body).toMatchObject({
      success: true,
      message: 'Shipment tracking updated',
    });
    expect(correction.body.data.trackingNumber).toBe('TRACK-CORRECTED');
    expect(correction.body.data.trackingHistory).toHaveLength(
      first.body.data.trackingHistory.length + 1
    );
    expect(correction.body.data.trackingHistory.at(-1)).toMatchObject({
      status: 'shipped',
      description: 'Tracking number corrected',
    });
  });

  it('deduplicates concurrent shipped retries into one tracking event', async () => {
    const owner = await createUser();
    const admin = await createUser({ isAdmin: true });
    const order = await createOrder(owner, {
      status: 'processing',
      paymentStatus: 'paid',
    });
    const payload = {
      status: 'shipped',
      carrier: 'DHL',
      trackingNumber: 'TRACK-CONCURRENT',
      description: 'Carrier scan',
      location: 'Warehouse',
    };

    const responses = await Promise.all([
      request(app)
        .patch(fulfillmentPath(order._id))
        .set(authHeader(admin))
        .send(payload)
        .expect(200),
      request(app)
        .patch(fulfillmentPath(order._id))
        .set(authHeader(admin))
        .send(payload)
        .expect(200),
    ]);

    const messages = responses.map((response) => response.body.message).sort();
    const refreshed = await Order.findById(order._id);
    const shippedEvents = refreshed.trackingHistory.filter((event) => event.status === 'shipped');

    expect(messages).toEqual([
      'Fulfillment update already applied',
      'Order marked as shipped',
    ]);
    expect(refreshed.status).toBe('shipped');
    expect(shippedEvents).toHaveLength(1);
    expect(shippedEvents[0]).toMatchObject({
      description: 'Carrier scan',
      location: 'Warehouse',
    });
  });

  it('deduplicates concurrent delivered retries into one tracking event', async () => {
    const owner = await createUser();
    const admin = await createUser({ isAdmin: true });
    const order = await createOrder(owner, {
      status: 'shipped',
      paymentStatus: 'paid',
      carrier: 'DHL',
      trackingNumber: 'TRACK-DELIVER',
      shippedAt: new Date('2026-06-18T10:00:00.000Z'),
      trackingHistory: [
        {
          status: 'shipped',
          description: 'Package handed to carrier',
          timestamp: new Date('2026-06-18T10:00:00.000Z'),
          location: 'Warehouse',
        },
      ],
    });
    const payload = {
      status: 'delivered',
      description: 'Delivered to customer',
      location: 'Front door',
    };

    const responses = await Promise.all([
      request(app)
        .patch(fulfillmentPath(order._id))
        .set(authHeader(admin))
        .send(payload)
        .expect(200),
      request(app)
        .patch(fulfillmentPath(order._id))
        .set(authHeader(admin))
        .send(payload)
        .expect(200),
    ]);

    const messages = responses.map((response) => response.body.message).sort();
    const refreshed = await Order.findById(order._id);
    const deliveredEvents = refreshed.trackingHistory.filter(
      (event) => event.status === 'delivered'
    );

    expect(messages).toEqual([
      'Fulfillment update already applied',
      'Order marked as delivered',
    ]);
    expect(refreshed.status).toBe('delivered');
    expect(deliveredEvents).toHaveLength(1);
    expect(deliveredEvents[0]).toMatchObject({
      description: 'Delivered to customer',
      location: 'Front door',
    });
  });
});
