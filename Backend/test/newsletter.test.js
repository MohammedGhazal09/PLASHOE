import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app.js';
import NewsletterSubscription from '../models/NewsletterSubscription.js';
import { authHeader } from './helpers/auth.js';
import { createUser } from './helpers/factories.js';

const newsletterPath = '/api/newsletter';

const subscribe = (payload = {}) =>
  request(app)
    .post(newsletterPath)
    .send({
      email: 'Subscriber@Example.com',
      consent: true,
      source: 'home_newsletter',
      ...payload,
    });

describe('newsletter subscription routes', () => {
  it('captures consent-backed subscriptions and keeps duplicates idempotent', async () => {
    await subscribe({ consent: false }).expect(400);

    const created = await subscribe().expect(201);

    expect(created.body).toMatchObject({
      success: true,
      message: 'Newsletter subscription saved',
      data: {
        email: 'subscriber@example.com',
        source: 'home_newsletter',
        status: 'active',
      },
    });
    expect(JSON.stringify(created.body.data)).not.toContain('unsubscribeToken');
    expect(await NewsletterSubscription.countDocuments()).toBe(1);

    const duplicate = await subscribe().expect(200);

    expect(duplicate.body).toMatchObject({
      success: true,
      message: 'Newsletter subscription is active',
      data: {
        email: 'subscriber@example.com',
        status: 'active',
      },
    });
    expect(await NewsletterSubscription.countDocuments()).toBe(1);
  });

  it('unsubscribes by token and reactivates without creating duplicate records', async () => {
    await subscribe({ email: 'lifecycle@example.com', source: 'footer' }).expect(201);
    const original = await NewsletterSubscription.findOne({
      email: 'lifecycle@example.com',
    }).select('+unsubscribeToken');

    const unsubscribed = await request(app)
      .post(`${newsletterPath}/unsubscribe/${original.unsubscribeToken}`)
      .expect(200);

    expect(unsubscribed.body).toMatchObject({
      success: true,
      data: {
        email: 'lifecycle@example.com',
        status: 'unsubscribed',
      },
    });

    await request(app)
      .post(`${newsletterPath}/unsubscribe/${original.unsubscribeToken}`)
      .expect(200);

    const reactivated = await subscribe({
      email: 'lifecycle@example.com',
      source: 'home_newsletter',
    }).expect(200);

    expect(reactivated.body.data).toMatchObject({
      email: 'lifecycle@example.com',
      status: 'active',
      source: 'home_newsletter',
    });
    expect(await NewsletterSubscription.countDocuments({ email: 'lifecycle@example.com' })).toBe(1);

    const refreshed = await NewsletterSubscription.findOne({
      email: 'lifecycle@example.com',
    }).select('+unsubscribeToken');
    expect(refreshed.unsubscribeToken).not.toBe(original.unsubscribeToken);
  });

  it('requires admin role for newsletter admin endpoints', async () => {
    const customer = await createUser();
    const admin = await createUser({ isAdmin: true });

    await request(app).get(`${newsletterPath}/admin`).expect(401);
    await request(app).get(`${newsletterPath}/admin/summary`).expect(401);

    await request(app)
      .get(`${newsletterPath}/admin`)
      .set(authHeader(customer))
      .expect(403);

    await request(app)
      .get(`${newsletterPath}/admin`)
      .set(authHeader(admin))
      .expect(200);

    await request(app)
      .get(`${newsletterPath}/admin/summary`)
      .set(authHeader(admin))
      .expect(200);
  });

  it('lists, filters, and summarizes subscriptions without exposing tokens', async () => {
    const admin = await createUser({ isAdmin: true });

    await subscribe({ email: 'active-home@example.com', source: 'home_newsletter' }).expect(201);
    await subscribe({ email: 'active-footer@example.com', source: 'footer' }).expect(201);
    await subscribe({ email: 'later-unsubscribe@example.com', source: 'footer' }).expect(201);

    const toUnsubscribe = await NewsletterSubscription.findOne({
      email: 'later-unsubscribe@example.com',
    }).select('+unsubscribeToken');
    await request(app)
      .post(`${newsletterPath}/unsubscribe/${toUnsubscribe.unsubscribeToken}`)
      .expect(200);

    const footerActive = await request(app)
      .get(`${newsletterPath}/admin`)
      .query({ status: 'active', source: 'footer', q: 'footer' })
      .set(authHeader(admin))
      .expect(200);

    expect(footerActive.body).toMatchObject({
      success: true,
      count: 1,
      total: 1,
      data: [
        {
          email: 'active-footer@example.com',
          status: 'active',
          source: 'footer',
        },
      ],
    });
    expect(JSON.stringify(footerActive.body.data)).not.toContain('unsubscribeToken');

    const summary = await request(app)
      .get(`${newsletterPath}/admin/summary`)
      .set(authHeader(admin))
      .expect(200);

    expect(summary.body.data).toMatchObject({
      totalCount: 3,
      activeCount: 2,
      statusCounts: {
        active: 2,
        unsubscribed: 1,
      },
    });
    expect(summary.body.data.sourceCounts).toEqual(
      expect.arrayContaining([
        { source: 'footer', count: 2 },
        { source: 'home_newsletter', count: 1 },
      ])
    );
    expect(JSON.stringify(summary.body.data)).not.toContain('unsubscribeToken');
  });
});
