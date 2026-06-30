import mongoose from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app.js';
import BackInStockRequest from '../models/BackInStockRequest.js';
import { authHeader } from './helpers/auth.js';
import { createProduct, createUser } from './helpers/factories.js';

const adminListPath = '/api/back-in-stock/admin';
const adminSummaryPath = '/api/back-in-stock/admin/summary';

describe('admin back-in-stock routes', () => {
  it('requires a token and admin role', async () => {
    const customer = await createUser();
    const admin = await createUser({ isAdmin: true });

    await request(app).get(adminListPath).expect(401);

    await request(app)
      .get(adminListPath)
      .set(authHeader(customer))
      .expect(403);

    await request(app)
      .get(adminListPath)
      .set(authHeader(admin))
      .expect(200);
  });

  it('lists and summarizes demand with product, size, email, and status filters', async () => {
    const admin = await createUser({ isAdmin: true });
    const trailRunner = await createProduct({
      name: 'Trail Demand Runner',
      stock: 0,
      sizes: [41, 42],
    });
    const courtRunner = await createProduct({
      name: 'Court Demand Runner',
      stock: 0,
      sizes: [40, 42],
    });

    await BackInStockRequest.create([
      {
        product: trailRunner._id,
        size: 42,
        email: 'alpha@example.com',
        consent: true,
        status: 'pending',
      },
      {
        product: trailRunner._id,
        size: 42,
        email: 'beta@example.com',
        consent: true,
        status: 'pending',
      },
      {
        product: courtRunner._id,
        size: 40,
        email: 'alpha@example.com',
        consent: true,
        status: 'notified',
        notifiedAt: new Date(),
      },
    ]);

    const filtered = await request(app)
      .get(adminListPath)
      .query({
        status: 'pending',
        productId: trailRunner._id.toString(),
        size: 42,
        email: 'ALPHA',
      })
      .set(authHeader(admin))
      .expect(200);

    expect(filtered.body).toMatchObject({
      success: true,
      count: 1,
      total: 1,
      data: [
        {
          size: 42,
          email: 'alpha@example.com',
          status: 'pending',
          product: {
            name: 'Trail Demand Runner',
            stock: 0,
          },
        },
      ],
    });

    const notified = await request(app)
      .get(adminListPath)
      .query({ status: 'notified' })
      .set(authHeader(admin))
      .expect(200);

    expect(notified.body.count).toBe(1);
    expect(notified.body.data[0]).toMatchObject({
      email: 'alpha@example.com',
      status: 'notified',
      product: {
        name: 'Court Demand Runner',
      },
    });

    const summary = await request(app)
      .get(adminSummaryPath)
      .set(authHeader(admin))
      .expect(200);

    expect(summary.body.data).toMatchObject({
      totalCount: 3,
      pendingCount: 2,
      statusCounts: {
        pending: 2,
        notified: 1,
      },
      pendingBySize: [{ size: 42, count: 2 }],
      topDemand: [
        {
          product: {
            name: 'Trail Demand Runner',
            stock: 0,
          },
          size: 42,
          pendingCount: 2,
          emailCount: 2,
        },
      ],
    });
    expect(JSON.stringify(summary.body.data.topDemand)).not.toContain('alpha@example.com');
  });

  it('updates statuses without blocking a new pending request for the same product, size, and email', async () => {
    const admin = await createUser({ isAdmin: true });
    const product = await createProduct({
      name: 'Restock Transition Runner',
      stock: 0,
      sizes: [42],
    });
    const savedRequest = await BackInStockRequest.create({
      product: product._id,
      size: 42,
      email: 'customer@example.com',
      consent: true,
      status: 'pending',
    });

    const updated = await request(app)
      .patch(`${adminListPath}/${savedRequest._id}/status`)
      .set(authHeader(admin))
      .send({ status: 'notified' })
      .expect(200);

    expect(updated.body).toMatchObject({
      success: true,
      message: 'Back-in-stock request marked notified',
      data: {
        status: 'notified',
        email: 'customer@example.com',
      },
    });
    expect(updated.body.data.notifiedAt).toEqual(expect.any(String));

    await request(app)
      .post('/api/back-in-stock')
      .send({
        productId: product._id.toString(),
        size: 42,
        email: 'customer@example.com',
        consent: true,
      })
      .expect(201);

    expect(
      await BackInStockRequest.countDocuments({
        product: product._id,
        size: 42,
        email: 'customer@example.com',
        status: 'pending',
      })
    ).toBe(1);
  });

  it('rejects invalid status transitions and returns 404 for missing requests', async () => {
    const admin = await createUser({ isAdmin: true });
    const missingId = new mongoose.Types.ObjectId().toString();

    await request(app)
      .patch(`${adminListPath}/${missingId}/status`)
      .set(authHeader(admin))
      .send({ status: 'notified' })
      .expect(404);

    await request(app)
      .patch(`${adminListPath}/${missingId}/status`)
      .set(authHeader(admin))
      .send({ status: 'pending' })
      .expect(400);
  });
});
