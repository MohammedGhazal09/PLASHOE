import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app.js';
import ContactMessage from '../models/ContactMessage.js';
import Coupon from '../models/Coupon.js';
import { authHeader } from './helpers/auth.js';
import {
  createContactMessage,
  createCoupon,
  createUser,
} from './helpers/factories.js';

const setCreatedAt = async (model, document, createdAt) =>
  model.collection.updateOne(
    { _id: document._id },
    { $set: { createdAt, updatedAt: createdAt } }
  );

const createCoupons = async (count) =>
  Coupon.insertMany(
    Array.from({ length: count }, (_, index) => ({
      code: `BULK${index}`,
      discountPercentage: 10,
      minOrderAmount: 0,
      validUntil: new Date('2026-12-31T00:00:00.000Z'),
      isActive: true,
    }))
  );

const createMessages = async (count) =>
  ContactMessage.insertMany(
    Array.from({ length: count }, (_, index) => ({
      name: `Contact ${index}`,
      email: `contact-${index}@example.com`,
      subject: 'Question',
      message: 'I need help.',
      isRead: false,
    }))
  );

describe('admin coupon and contact list routes', () => {
  it('requires a token and admin role for coupon and contact admin lists', async () => {
    const customer = await createUser();
    const admin = await createUser({ isAdmin: true });

    await request(app).get('/api/coupons').expect(401);
    await request(app).get('/api/contact').expect(401);

    await request(app)
      .get('/api/coupons')
      .set(authHeader(customer))
      .expect(403);
    await request(app)
      .get('/api/contact')
      .set(authHeader(customer))
      .expect(403);

    await request(app)
      .get('/api/coupons')
      .set(authHeader(admin))
      .expect(200);
    await request(app)
      .get('/api/contact')
      .set(authHeader(admin))
      .expect(200);
  });

  it('paginates coupon admin lists with default and capped limits', async () => {
    const admin = await createUser({ isAdmin: true });
    await createCoupons(105);

    const defaults = await request(app)
      .get('/api/coupons')
      .set(authHeader(admin))
      .expect(200);

    expect(defaults.body).toMatchObject({
      success: true,
      count: 20,
      total: 105,
      page: 1,
      limit: 20,
      pages: 6,
    });

    const capped = await request(app)
      .get('/api/coupons')
      .query({ limit: 500 })
      .set(authHeader(admin))
      .expect(200);

    expect(capped.body).toMatchObject({
      count: 100,
      total: 105,
      limit: 100,
      pages: 2,
    });
  });

  it('paginates contact admin lists with default and capped limits', async () => {
    const admin = await createUser({ isAdmin: true });
    await createMessages(105);

    const defaults = await request(app)
      .get('/api/contact')
      .set(authHeader(admin))
      .expect(200);

    expect(defaults.body).toMatchObject({
      success: true,
      count: 20,
      total: 105,
      page: 1,
      limit: 20,
      pages: 6,
    });

    const capped = await request(app)
      .get('/api/contact')
      .query({ limit: 500 })
      .set(authHeader(admin))
      .expect(200);

    expect(capped.body).toMatchObject({
      count: 100,
      total: 105,
      limit: 100,
      pages: 2,
    });
  });

  it('rejects invalid pagination and unknown query keys for coupon and contact lists', async () => {
    const admin = await createUser({ isAdmin: true });

    await request(app)
      .get('/api/coupons')
      .query({ limit: 0 })
      .set(authHeader(admin))
      .expect(400);
    await request(app)
      .get('/api/coupons')
      .query({ includePrivate: 'true' })
      .set(authHeader(admin))
      .expect(400);

    await request(app)
      .get('/api/contact')
      .query({ page: 0 })
      .set(authHeader(admin))
      .expect(400);
    await request(app)
      .get('/api/contact')
      .query({ includePrivate: 'true' })
      .set(authHeader(admin))
      .expect(400);
  });

  it('filters coupon admin lists by active state, search text, and validity dates', async () => {
    const admin = await createUser({ isAdmin: true });
    await createCoupon({
      code: 'ACTIVE10',
      isActive: true,
      validFrom: new Date('2026-06-01T00:00:00.000Z'),
      validUntil: new Date('2026-09-01T00:00:00.000Z'),
    });
    await createCoupon({
      code: 'INACTIVE10',
      isActive: false,
      validFrom: new Date('2026-06-01T00:00:00.000Z'),
      validUntil: new Date('2026-09-01T00:00:00.000Z'),
    });
    await createCoupon({
      code: 'SUMMER20',
      isActive: true,
      validFrom: new Date('2026-07-01T00:00:00.000Z'),
      validUntil: new Date('2026-08-31T00:00:00.000Z'),
    });
    await createCoupon({
      code: 'WINTER20',
      isActive: true,
      validFrom: new Date('2026-01-01T00:00:00.000Z'),
      validUntil: new Date('2026-12-31T00:00:00.000Z'),
    });

    const inactive = await request(app)
      .get('/api/coupons')
      .query({ isActive: 'false' })
      .set(authHeader(admin))
      .expect(200);
    expect(inactive.body.data.map((coupon) => coupon.code)).toEqual(['INACTIVE10']);

    const search = await request(app)
      .get('/api/coupons')
      .query({ q: 'summer' })
      .set(authHeader(admin))
      .expect(200);
    expect(search.body.data.map((coupon) => coupon.code)).toEqual(['SUMMER20']);

    const validWindow = await request(app)
      .get('/api/coupons')
      .query({
        validFrom: '2026-06-15T00:00:00.000Z',
        validUntil: '2026-10-01T00:00:00.000Z',
      })
      .set(authHeader(admin))
      .expect(200);

    const codes = validWindow.body.data.map((coupon) => coupon.code);
    expect(codes).toEqual(['SUMMER20']);
    expect(codes).not.toContain('WINTER20');
  });

  it('filters contact admin lists by read state, search text, and created dates', async () => {
    const admin = await createUser({ isAdmin: true });
    const unread = await createContactMessage({
      name: 'Unread Customer',
      email: 'unread@example.com',
      isRead: false,
    });
    const read = await createContactMessage({
      name: 'Read Customer',
      email: 'read@example.com',
      isRead: true,
    });
    const searchable = await createContactMessage({
      name: 'Special Finder',
      email: 'finder@example.com',
      isRead: false,
    });
    const old = await createContactMessage({
      name: 'Old Finder',
      email: 'archive@example.com',
      isRead: false,
    });

    await setCreatedAt(ContactMessage, unread, new Date('2026-06-10T12:00:00.000Z'));
    await setCreatedAt(ContactMessage, read, new Date('2026-06-11T12:00:00.000Z'));
    await setCreatedAt(ContactMessage, searchable, new Date('2026-06-12T12:00:00.000Z'));
    await setCreatedAt(ContactMessage, old, new Date('2026-05-01T12:00:00.000Z'));

    const unreadOnly = await request(app)
      .get('/api/contact')
      .query({ isRead: 'false' })
      .set(authHeader(admin))
      .expect(200);
    expect(unreadOnly.body.data.map((message) => message.email)).not.toContain(
      'read@example.com'
    );

    const search = await request(app)
      .get('/api/contact')
      .query({ q: 'finder@example.com' })
      .set(authHeader(admin))
      .expect(200);
    expect(search.body.data.map((message) => message.email)).toEqual([
      'finder@example.com',
    ]);

    const dateWindow = await request(app)
      .get('/api/contact')
      .query({
        q: 'finder',
        createdFrom: '2026-06-01T00:00:00.000Z',
        createdTo: '2026-06-30T23:59:59.999Z',
      })
      .set(authHeader(admin))
      .expect(200);

    const emails = dateWindow.body.data.map((message) => message.email);
    expect(emails).toEqual(['finder@example.com']);
    expect(emails).not.toContain('archive@example.com');
  });
});
