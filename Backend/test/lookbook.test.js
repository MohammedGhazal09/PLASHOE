import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import LookbookEntry from '../models/LookbookEntry.js';
import { authHeader } from './helpers/auth.js';
import { createProduct, createUser } from './helpers/factories.js';

describe('lookbook routes', () => {
  it('returns active lookbook entries with populated tagged products and bundle items', async () => {
    const heroProduct = await createProduct({
      name: 'City Runner',
      image: '/images/city-runner.jpg',
      sizes: [41, 42],
      stock: 8,
    });
    const secondProduct = await createProduct({
      name: 'Trail Slip-On',
      image: '/images/trail-slip-on.jpg',
      sizes: [40, 41],
      stock: 4,
    });

    await LookbookEntry.create({
      title: 'City Commute',
      image: '/images/lookbook-city.jpg',
      status: 'active',
      sortOrder: 1,
      hotspots: [{ product: heroProduct._id, x: 32, y: 64, label: 'Runner' }],
      bundle: {
        title: 'Commute Set',
        items: [
          { product: heroProduct._id, defaultSize: 42, quantity: 1 },
          { product: secondProduct._id, defaultSize: 41, quantity: 1 },
        ],
      },
    });
    await LookbookEntry.create({
      title: 'Draft Scene',
      image: '/images/lookbook-draft.jpg',
      status: 'draft',
      hotspots: [{ product: secondProduct._id, x: 50, y: 50 }],
    });

    const response = await request(app).get('/api/lookbook').expect(200);

    expect(response.body).toMatchObject({
      success: true,
      count: 1,
    });
    expect(response.body.data[0]).toMatchObject({
      title: 'City Commute',
      status: 'active',
      hotspots: [
        {
          x: 32,
          y: 64,
          label: 'Runner',
          product: {
            name: 'City Runner',
            stock: 8,
          },
        },
      ],
      bundle: {
        title: 'Commute Set',
        items: [
          {
            defaultSize: 42,
            quantity: 1,
            product: {
              name: 'City Runner',
            },
          },
          {
            defaultSize: 41,
            quantity: 1,
            product: {
              name: 'Trail Slip-On',
            },
          },
        ],
      },
    });
  });

  it('lets admins create and update lookbook entries with valid product references', async () => {
    const admin = await createUser({ isAdmin: true });
    const product = await createProduct({ name: 'Admin Runner' });
    const nextProduct = await createProduct({ name: 'Admin Classic', sizes: [40, 41] });

    const createResponse = await request(app)
      .post('/api/admin/lookbook')
      .set(authHeader(admin))
      .send({
        title: 'Admin Scene',
        image: '/images/admin-scene.jpg',
        status: 'draft',
        sortOrder: 4,
        hotspots: [{ productId: product._id.toString(), x: 25, y: 55 }],
      })
      .expect(201);

    expect(createResponse.body.data).toMatchObject({
      title: 'Admin Scene',
      status: 'draft',
      hotspots: [
        {
          product: {
            name: 'Admin Runner',
          },
        },
      ],
    });

    const updateResponse = await request(app)
      .put(`/api/admin/lookbook/${createResponse.body.data._id}`)
      .set(authHeader(admin))
      .send({
        status: 'active',
        bundle: {
          title: 'Admin Bundle',
          items: [{ productId: nextProduct._id.toString(), defaultSize: 41, quantity: 2 }],
        },
      })
      .expect(200);

    expect(updateResponse.body.data).toMatchObject({
      status: 'active',
      bundle: {
        title: 'Admin Bundle',
        items: [
          {
            defaultSize: 41,
            quantity: 2,
            product: {
              name: 'Admin Classic',
            },
          },
        ],
      },
    });
  });

  it('rejects invalid product references and hotspot coordinates', async () => {
    const admin = await createUser({ isAdmin: true });
    const missingProductId = '64f000000000000000000099';

    await request(app)
      .post('/api/admin/lookbook')
      .set(authHeader(admin))
      .send({
        title: 'Broken Scene',
        image: '/images/broken-scene.jpg',
        hotspots: [{ productId: missingProductId, x: 50, y: 50 }],
      })
      .expect(400);

    const response = await request(app)
      .post('/api/admin/lookbook')
      .set(authHeader(admin))
      .send({
        title: 'Invalid Scene',
        image: '/images/invalid-scene.jpg',
        hotspots: [{ productId: missingProductId, x: 101, y: 50 }],
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Invalid request',
    });
  });
});

