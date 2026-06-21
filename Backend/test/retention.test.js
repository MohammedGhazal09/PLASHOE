import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app.js';
import BackInStockRequest from '../models/BackInStockRequest.js';
import { createProduct } from './helpers/factories.js';

describe('retention lifecycle routes', () => {
  it('captures explicit back-in-stock intent for unavailable product sizes', async () => {
    const product = await createProduct({
      name: 'Sold Out Runner',
      stock: 0,
      sizes: [41, 42],
    });

    const response = await request(app)
      .post('/api/back-in-stock')
      .send({
        productId: product._id.toString(),
        size: 42,
        email: 'CUSTOMER@EXAMPLE.COM',
        consent: true,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      message: 'Back-in-stock request saved',
      data: {
        size: 42,
        email: 'customer@example.com',
        consent: true,
        status: 'pending',
      },
    });
    expect(await BackInStockRequest.countDocuments()).toBe(1);

    const duplicate = await request(app)
      .post('/api/back-in-stock')
      .send({
        productId: product._id.toString(),
        size: 42,
        email: 'customer@example.com',
        consent: true,
      })
      .expect(200);

    expect(duplicate.body.message).toBe('Back-in-stock request already exists');
    expect(await BackInStockRequest.countDocuments()).toBe(1);
  });

  it('rejects back-in-stock intent without consent or when the product is available', async () => {
    const product = await createProduct({
      name: 'Available Runner',
      stock: 3,
      sizes: [42],
    });

    await request(app)
      .post('/api/back-in-stock')
      .send({
        productId: product._id.toString(),
        size: 42,
        email: 'customer@example.com',
        consent: false,
      })
      .expect(400);

    const response = await request(app)
      .post('/api/back-in-stock')
      .send({
        productId: product._id.toString(),
        size: 42,
        email: 'customer@example.com',
        consent: true,
      })
      .expect(409);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Product is currently available',
      errors: [
        {
          code: 'PRODUCT_AVAILABLE',
          resource: 'product',
          productId: product._id.toString(),
          available: 3,
        },
      ],
    });
  });

  it('returns bounded explainable recommendations without out-of-stock products', async () => {
    const source = await createProduct({
      name: 'Source Runner',
      gender: 'male',
      category: 'Running',
      rating: 2,
      stock: 5,
    });
    const sameGenderCategory = await createProduct({
      name: 'Recommended Runner',
      gender: 'male',
      category: 'Running',
      rating: 5,
      stock: 5,
    });
    await createProduct({
      name: 'Sold Out Recommendation',
      gender: 'male',
      category: 'Running',
      rating: 5,
      stock: 0,
    });
    const fallback = await createProduct({
      name: 'Fallback Classic',
      gender: 'female',
      category: 'Classic',
      rating: 4,
      stock: 5,
    });

    const response = await request(app)
      .get('/api/recommendations')
      .query({ productId: source._id.toString(), limit: 2 })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      count: 2,
    });
    expect(response.body.data.map((product) => product._id)).toEqual([
      sameGenderCategory._id.toString(),
      fallback._id.toString(),
    ]);
    expect(response.body.data[0].recommendationReason).toBe('Similar running styles');
    expect(response.body.data.map((product) => product.name)).not.toContain(
      'Sold Out Recommendation'
    );
  });
});

