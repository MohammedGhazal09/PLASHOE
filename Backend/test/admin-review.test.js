import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app.js';
import Product from '../models/Product.js';
import { updateProductReviewAggregates } from '../controllers/reviewController.js';
import { authHeader } from './helpers/auth.js';
import {
  createProduct,
  createReviewForProduct,
  createUser,
} from './helpers/factories.js';

const adminReviewsPath = '/api/admin/reviews';

describe('admin review moderation routes', () => {
  it('requires a token and admin role', async () => {
    const customer = await createUser();
    const admin = await createUser({ isAdmin: true });

    await request(app).get(adminReviewsPath).expect(401);

    await request(app)
      .get(adminReviewsPath)
      .set(authHeader(customer))
      .expect(403);

    await request(app)
      .get(adminReviewsPath)
      .set(authHeader(admin))
      .expect(200);
  });

  it('lists and inspects reviews by approval state', async () => {
    const admin = await createUser({ isAdmin: true });
    const product = await createProduct({ name: 'Moderation Runner' });
    const approved = await createReviewForProduct(await createUser({ name: 'Approved Buyer' }), product, {
      title: 'Public review',
      comment: 'Useful public review.',
      isApproved: true,
    });
    await createReviewForProduct(await createUser({ name: 'Hidden Buyer' }), product, {
      title: 'Needs moderation',
      comment: 'Hidden until reviewed.',
      isApproved: false,
    });

    const hidden = await request(app)
      .get(adminReviewsPath)
      .query({ isApproved: 'false', q: 'moderation', productId: product._id.toString() })
      .set(authHeader(admin))
      .expect(200);

    expect(hidden.body).toMatchObject({
      success: true,
      count: 1,
      total: 1,
      data: [
        {
          title: 'Needs moderation',
          isApproved: false,
          product: { name: 'Moderation Runner' },
          user: { name: 'Hidden Buyer' },
        },
      ],
    });

    const detail = await request(app)
      .get(`${adminReviewsPath}/${approved._id}`)
      .set(authHeader(admin))
      .expect(200);

    expect(detail.body.data).toMatchObject({
      title: 'Public review',
      isApproved: true,
      product: { name: 'Moderation Runner' },
      user: { name: 'Approved Buyer' },
    });
  });

  it('hides and approves reviews while keeping public aggregates synchronized', async () => {
    const admin = await createUser({ isAdmin: true });
    const product = await createProduct({ rating: 0, reviewCount: 0 });
    const first = await createReviewForProduct(await createUser(), product, {
      rating: 5,
      title: 'Great shoe',
      fit: 'true_to_size',
      isApproved: true,
    });
    await createReviewForProduct(await createUser(), product, {
      rating: 3,
      title: 'Okay shoe',
      fit: 'runs_small',
      isApproved: true,
    });
    await updateProductReviewAggregates(product._id);

    await request(app)
      .patch(`${adminReviewsPath}/${first._id}/moderation`)
      .set(authHeader(admin))
      .send({ isApproved: false })
      .expect(200);

    let publicReviews = await request(app)
      .get(`/api/products/${product._id}/reviews`)
      .expect(200);

    expect(publicReviews.body).toMatchObject({
      total: 1,
      summary: {
        averageRating: 3,
        reviewCount: 1,
        ratingDistribution: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 0 },
        fitSummary: {
          runsSmall: 1,
          trueToSize: 0,
          runsLarge: 0,
          total: 1,
          dominant: 'runs_small',
        },
      },
    });
    expect(publicReviews.body.data.map((review) => review.title)).not.toContain('Great shoe');

    const approved = await request(app)
      .patch(`${adminReviewsPath}/${first._id}/moderation`)
      .set(authHeader(admin))
      .send({ isApproved: true })
      .expect(200);

    expect(approved.body).toMatchObject({
      success: true,
      message: 'Review approved',
      summary: {
        averageRating: 4,
        reviewCount: 2,
      },
      data: {
        isApproved: true,
      },
    });

    publicReviews = await request(app)
      .get(`/api/products/${product._id}/reviews`)
      .expect(200);

    expect(publicReviews.body.total).toBe(2);
    const updatedProduct = await Product.findById(product._id).lean();
    expect(updatedProduct).toMatchObject({
      rating: 4,
      reviewCount: 2,
      ratingDistribution: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 1 },
    });
  });

  it('returns 404 for missing review moderation targets', async () => {
    const admin = await createUser({ isAdmin: true });
    const product = await createProduct();

    await request(app)
      .patch(`${adminReviewsPath}/${product._id}/moderation`)
      .set(authHeader(admin))
      .send({ isApproved: true })
      .expect(404);
  });
});
