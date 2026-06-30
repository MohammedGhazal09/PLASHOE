import mongoose from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app.js';
import ReturnRequest from '../models/ReturnRequest.js';
import { authHeader } from './helpers/auth.js';
import {
  createContactMessage,
  createCoupon,
  createOrder,
  createProduct,
  createUser,
} from './helpers/factories.js';

const adminSummaryPath = '/api/admin/summary';

const orderItems = (price) => [
  {
    product: new mongoose.Types.ObjectId(),
    name: 'Metric Runner',
    image: '/metric-runner.jpg',
    quantity: 1,
    size: 42,
    price,
  },
];

describe('admin summary route', () => {
  it('requires a token and admin role', async () => {
    const customer = await createUser();
    const admin = await createUser({ isAdmin: true });

    await request(app).get(adminSummaryPath).expect(401);

    await request(app)
      .get(adminSummaryPath)
      .set(authHeader(customer))
      .expect(403);

    await request(app)
      .get(adminSummaryPath)
      .set(authHeader(admin))
      .expect(200);
  });

  it('returns zeroed metrics for an empty store', async () => {
    const admin = await createUser({ isAdmin: true });

    const response = await request(app)
      .get(adminSummaryPath)
      .set(authHeader(admin))
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        revenue: {
          paidTotal: 0,
          paidOrderCount: 0,
          averagePaidOrderValue: 0,
        },
        orders: {
          total: 0,
          byStatus: {},
          paymentsByStatus: {},
        },
        inventory: {
          productCount: 0,
          lowStockThreshold: 5,
          lowStockCount: 0,
          outOfStockCount: 0,
          lowStockProducts: [],
        },
        returns: {
          openCount: 0,
          byStatus: {},
        },
        messages: {
          unreadCount: 0,
        },
        coupons: {
          activeCount: 0,
          totalRedemptions: 0,
        },
      },
    });
    expect(response.body.data.generatedAt).toEqual(expect.any(String));
  });

  it('returns bounded aggregate metrics without customer-sensitive detail', async () => {
    const admin = await createUser({ isAdmin: true });
    const customer = await createUser({
      name: 'Metric Customer',
      email: 'metric-customer@example.com',
    });

    const paidProcessing = await createOrder(customer, {
      status: 'processing',
      paymentStatus: 'paid',
      items: orderItems(120),
      subtotal: 120,
      total: 120,
    });
    await createOrder(customer, {
      status: 'shipped',
      paymentStatus: 'paid',
      items: orderItems(80),
      subtotal: 80,
      total: 80,
    });
    await createOrder(customer, {
      status: 'cancelled',
      paymentStatus: 'payment_failed',
      items: orderItems(50),
      subtotal: 50,
      total: 50,
    });

    await createProduct({ name: 'Sold Out Runner', stock: 0 });
    await createProduct({ name: 'Low Stock Runner', stock: 3 });
    await createProduct({ name: 'Healthy Runner', stock: 20 });

    await ReturnRequest.create({
      user: customer._id,
      order: paidProcessing._id,
      orderNumber: paidProcessing.orderNumber,
      type: 'return',
      status: 'requested',
    });
    await ReturnRequest.create({
      user: customer._id,
      order: paidProcessing._id,
      orderNumber: paidProcessing.orderNumber,
      type: 'exchange',
      status: 'approved',
    });
    await ReturnRequest.create({
      user: customer._id,
      order: paidProcessing._id,
      orderNumber: paidProcessing.orderNumber,
      type: 'return',
      status: 'resolved',
    });

    await createContactMessage({ isRead: false });
    await createContactMessage({ isRead: true });
    await createCoupon({ code: 'ACTIVEUSED', isActive: true, usedCount: 2 });
    await createCoupon({ code: 'INACTIVEUSED', isActive: false, usedCount: 5 });

    const response = await request(app)
      .get(adminSummaryPath)
      .set(authHeader(admin))
      .expect(200);

    expect(response.body.data).toMatchObject({
      revenue: {
        paidTotal: 200,
        paidOrderCount: 2,
        averagePaidOrderValue: 100,
      },
      orders: {
        total: 3,
        byStatus: {
          cancelled: 1,
          processing: 1,
          shipped: 1,
        },
        paymentsByStatus: {
          paid: 2,
          payment_failed: 1,
        },
      },
      inventory: {
        productCount: 3,
        lowStockThreshold: 5,
        lowStockCount: 1,
        outOfStockCount: 1,
      },
      returns: {
        openCount: 2,
        byStatus: {
          approved: 1,
          requested: 1,
          resolved: 1,
        },
      },
      messages: {
        unreadCount: 1,
      },
      coupons: {
        activeCount: 1,
        totalRedemptions: 7,
      },
    });
    expect(response.body.data.inventory.lowStockProducts).toHaveLength(2);
    expect(response.body.data.inventory.lowStockProducts.map((product) => product.name)).toEqual([
      'Sold Out Runner',
      'Low Stock Runner',
    ]);
    expect(JSON.stringify(response.body.data)).not.toContain('metric-customer@example.com');
  });

  it('limits low-stock product details to five rows', async () => {
    const admin = await createUser({ isAdmin: true });

    await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        createProduct({ name: `Low Stock ${index}`, stock: 1 })
      )
    );

    const response = await request(app)
      .get(adminSummaryPath)
      .set(authHeader(admin))
      .expect(200);

    expect(response.body.data.inventory.lowStockCount).toBe(8);
    expect(response.body.data.inventory.lowStockProducts).toHaveLength(5);
  });
});
