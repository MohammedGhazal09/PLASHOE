import mongoose from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app.js';
import Order from '../models/Order.js';
import ReturnRequest from '../models/ReturnRequest.js';
import { authHeader } from './helpers/auth.js';
import {
  createOrder,
  createUser,
} from './helpers/factories.js';

const returnsPath = '/api/returns';
const adminReturnsPath = '/api/admin/returns';
const statusPath = (id) => `${adminReturnsPath}/${id}/status`;

const deliveredAt = () => new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
const expiredDeliveredAt = () => new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);

const getFirstOrderItem = (order) => order.items[0];

const createEligibleOrder = async (user, overrides = {}) =>
  createOrder(user, {
    status: 'delivered',
    paymentStatus: 'paid',
    deliveredAt: deliveredAt(),
    ...overrides,
  });

const createRequestPayload = (order, overrides = {}) => {
  const item = getFirstOrderItem(order);

  return {
    orderId: order._id.toString(),
    type: 'return',
    items: [
      {
        orderItemId: item._id.toString(),
        quantity: 1,
        reason: 'Size did not work',
      },
    ],
    customerNotes: 'Please review this return.',
    ...overrides,
  };
};

describe('return request routes', () => {
  it('lets a customer create and list an eligible return request with status history', async () => {
    const user = await createUser();
    const order = await createEligibleOrder(user);

    const created = await request(app)
      .post(returnsPath)
      .set(authHeader(user))
      .send(createRequestPayload(order))
      .expect(201);

    expect(created.body.data).toMatchObject({
      user: user._id.toString(),
      order: order._id.toString(),
      orderNumber: order.orderNumber,
      type: 'return',
      status: 'requested',
      refundIntent: {
        requestedAmount: order.items[0].price,
        status: 'manual_review_required',
        orderPaymentStatusAtRequest: 'paid',
      },
    });
    expect(created.body.data.requestNumber).toMatch(/^RMA-/);
    expect(created.body.data.items[0]).toMatchObject({
      orderItemId: order.items[0]._id.toString(),
      quantity: 1,
      reason: 'Size did not work',
    });
    expect(created.body.data.statusHistory).toHaveLength(1);
    expect(created.body.data.statusHistory[0]).toMatchObject({
      status: 'requested',
      actorRole: 'customer',
    });

    const list = await request(app)
      .get(returnsPath)
      .query({ orderId: order._id.toString() })
      .set(authHeader(user))
      .expect(200);

    expect(list.body.count).toBe(1);
    expect(list.body.data[0].requestNumber).toBe(created.body.data.requestNumber);
  });

  it('enforces customer ownership and authentication boundaries', async () => {
    const owner = await createUser();
    const otherUser = await createUser();
    const admin = await createUser({ isAdmin: true });
    const order = await createEligibleOrder(owner);
    const requestRecord = await ReturnRequest.create({
      user: owner._id,
      order: order._id,
      orderNumber: order.orderNumber,
      type: 'return',
      status: 'requested',
      items: [
        {
          orderItemId: order.items[0]._id,
          product: order.items[0].product,
          name: order.items[0].name,
          quantity: 1,
          price: order.items[0].price,
          reason: 'Too small',
        },
      ],
      statusHistory: [{ status: 'requested', actor: owner._id, actorRole: 'customer' }],
    });

    await request(app).post(returnsPath).send(createRequestPayload(order)).expect(401);

    await request(app)
      .post(returnsPath)
      .set(authHeader(otherUser))
      .send(createRequestPayload(order))
      .expect(404);

    await request(app)
      .get(`${returnsPath}/${requestRecord._id}`)
      .set(authHeader(otherUser))
      .expect(403);

    await request(app)
      .get(`${adminReturnsPath}/${requestRecord._id}`)
      .set(authHeader(owner))
      .expect(403);

    await request(app)
      .get(`${adminReturnsPath}/${requestRecord._id}`)
      .set(authHeader(admin))
      .expect(200);
  });

  it('rejects ineligible orders by fulfillment, payment, return window, and requested quantity', async () => {
    const user = await createUser();
    const processingOrder = await createOrder(user, {
      status: 'processing',
      paymentStatus: 'paid',
    });
    const unpaidOrder = await createEligibleOrder(user, {
      paymentStatus: 'payment_pending',
    });
    const refundedOrder = await createEligibleOrder(user, {
      paymentStatus: 'refunded',
      refundAmount: 100,
    });
    const expiredOrder = await createEligibleOrder(user, {
      deliveredAt: expiredDeliveredAt(),
    });
    const eligibleOrder = await createEligibleOrder(user);

    const notDelivered = await request(app)
      .post(returnsPath)
      .set(authHeader(user))
      .send(createRequestPayload(processingOrder))
      .expect(409);

    expect(notDelivered.body.errors[0].code).toBe('ORDER_NOT_DELIVERED');

    for (const order of [unpaidOrder, refundedOrder]) {
      const response = await request(app)
        .post(returnsPath)
        .set(authHeader(user))
        .send(createRequestPayload(order))
        .expect(409);

      expect(response.body.errors[0].code).toBe('PAYMENT_NOT_ELIGIBLE');
    }

    const expired = await request(app)
      .post(returnsPath)
      .set(authHeader(user))
      .send(createRequestPayload(expiredOrder))
      .expect(409);

    expect(expired.body.errors[0].code).toBe('RETURN_WINDOW_EXPIRED');

    const overQuantity = await request(app)
      .post(returnsPath)
      .set(authHeader(user))
      .send(
        createRequestPayload(eligibleOrder, {
          items: [
            {
              orderItemId: eligibleOrder.items[0]._id.toString(),
              quantity: eligibleOrder.items[0].quantity + 1,
              reason: 'Too many',
            },
          ],
        })
      )
      .expect(409);

    expect(overQuantity.body.errors[0].code).toBe('QUANTITY_EXCEEDS_ELIGIBLE');
  });

  it('prevents duplicate active requests from exceeding delivered item quantity', async () => {
    const user = await createUser();
    const order = await createEligibleOrder(user, {
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          name: 'Duplicate Guard Runner',
          image: '/runner.jpg',
          quantity: 2,
          size: 42,
          price: 100,
        },
      ],
      subtotal: 200,
      total: 200,
    });

    await request(app)
      .post(returnsPath)
      .set(authHeader(user))
      .send(createRequestPayload(order))
      .expect(201);

    await request(app)
      .post(returnsPath)
      .set(authHeader(user))
      .send(createRequestPayload(order))
      .expect(201);

    const duplicate = await request(app)
      .post(returnsPath)
      .set(authHeader(user))
      .send(createRequestPayload(order))
      .expect(409);

    expect(duplicate.body.errors[0].code).toBe('QUANTITY_EXCEEDS_ELIGIBLE');
  });

  it('supports exchange requests with desired size validation', async () => {
    const user = await createUser();
    const order = await createEligibleOrder(user);

    const missingSize = await request(app)
      .post(returnsPath)
      .set(authHeader(user))
      .send(
        createRequestPayload(order, {
          type: 'exchange',
          items: [
            {
              orderItemId: order.items[0]._id.toString(),
              quantity: 1,
              reason: 'Need a larger size',
            },
          ],
        })
      )
      .expect(400);

    expect(missingSize.body.errors[0].code).toBe('EXCHANGE_SIZE_REQUIRED');

    const exchange = await request(app)
      .post(returnsPath)
      .set(authHeader(user))
      .send(
        createRequestPayload(order, {
          type: 'exchange',
          items: [
            {
              orderItemId: order.items[0]._id.toString(),
              quantity: 1,
              reason: 'Need a larger size',
              exchangeSize: 43,
            },
          ],
        })
      )
      .expect(201);

    expect(exchange.body.data).toMatchObject({
      type: 'exchange',
      refundIntent: { requestedAmount: 0, status: 'not_applicable' },
    });
    expect(exchange.body.data.items[0].exchangeSize).toBe(43);
  });

  it('allows admins to approve, receive, and resolve without changing provider refund fields', async () => {
    const user = await createUser();
    const admin = await createUser({ isAdmin: true });
    const order = await createEligibleOrder(user, {
      paymentProvider: 'stripe',
      paymentProviderIntentId: 'pi_return_123',
      refundAmount: 12,
      refundRecords: [
        {
          provider: 'stripe',
          providerRefundId: 're_existing',
          amount: 12,
          status: 'succeeded',
        },
      ],
    });

    const created = await request(app)
      .post(returnsPath)
      .set(authHeader(user))
      .send(createRequestPayload(order))
      .expect(201);

    const approve = await request(app)
      .patch(statusPath(created.body.data._id))
      .set(authHeader(admin))
      .send({ status: 'approved', note: 'Approved by support' })
      .expect(200);

    expect(approve.body.data).toMatchObject({ status: 'approved' });
    expect(approve.body.data.statusHistory).toHaveLength(2);

    await request(app)
      .patch(statusPath(created.body.data._id))
      .set(authHeader(admin))
      .send({ status: 'received', note: 'Received at warehouse' })
      .expect(200);

    const resolved = await request(app)
      .patch(statusPath(created.body.data._id))
      .set(authHeader(admin))
      .send({ status: 'resolved', note: 'Manual refund recorded', refundAmount: 88 })
      .expect(200);

    expect(resolved.body.data).toMatchObject({
      status: 'resolved',
      refundIntent: {
        requestedAmount: order.items[0].price,
        resolvedAmount: 88,
        status: 'manual_refund_recorded',
        providerRefundIdsAtRequest: ['re_existing'],
      },
    });
    expect(resolved.body.data.statusHistory).toHaveLength(4);

    const unchangedOrder = await Order.findById(order._id);
    expect(unchangedOrder.paymentStatus).toBe('paid');
    expect(unchangedOrder.refundAmount).toBe(12);
    expect(unchangedOrder.refundRecords).toHaveLength(1);
    expect(unchangedOrder.refundRecords[0].providerRefundId).toBe('re_existing');
  });

  it('rejects invalid admin transitions and malformed admin updates', async () => {
    const user = await createUser();
    const admin = await createUser({ isAdmin: true });
    const order = await createEligibleOrder(user);
    const created = await request(app)
      .post(returnsPath)
      .set(authHeader(user))
      .send(createRequestPayload(order))
      .expect(201);

    await request(app)
      .patch(statusPath(created.body.data._id))
      .set(authHeader(admin))
      .send({ status: 'resolved' })
      .expect(409);

    await request(app)
      .patch(statusPath(created.body.data._id))
      .set(authHeader(admin))
      .send({ status: 'cancelled' })
      .expect(400);
  });

  it('lists admin return requests with pagination and filters', async () => {
    const user = await createUser({ email: 'returns@example.com' });
    const admin = await createUser({ isAdmin: true });
    const firstOrder = await createEligibleOrder(user, { orderNumber: 'PLS-RMA-FIRST' });
    const secondOrder = await createEligibleOrder(user, { orderNumber: 'PLS-RMA-SECOND' });

    await request(app)
      .post(returnsPath)
      .set(authHeader(user))
      .send(createRequestPayload(firstOrder))
      .expect(201);
    await request(app)
      .post(returnsPath)
      .set(authHeader(user))
      .send(createRequestPayload(secondOrder, { type: 'return' }))
      .expect(201);

    const response = await request(app)
      .get(adminReturnsPath)
      .query({ q: 'PLS-RMA', limit: 1, page: 1, status: 'requested' })
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
    expect(response.body.data[0].user).toMatchObject({
      email: 'returns@example.com',
    });
  });
});
