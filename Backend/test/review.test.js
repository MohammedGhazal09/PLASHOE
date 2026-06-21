import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../app.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import { updateProductReviewAggregates } from "../controllers/reviewController.js";
import { authHeader } from "./helpers/auth.js";
import {
  createOrder,
  createProduct,
  createReviewForProduct,
  createUser,
} from "./helpers/factories.js";

const createVerifiedOrderFor = async (user, product, overrides = {}) =>
  createOrder(user, {
    status: "delivered",
    paymentStatus: "paid",
    items: [
      {
        product: product._id,
        name: product.name,
        image: product.image,
        quantity: 1,
        size: 42,
        price: product.price.current,
      },
    ],
    ...overrides,
  });

describe("product review routes", () => {
  it("lists only approved reviews with limited user display data", async () => {
    const product = await createProduct();
    const user = await createUser({ name: "Public Reviewer", email: "reviewer@example.com" });
    await createReviewForProduct(user, product, {
      title: "Clean daily shoe",
      comment: "The fit was reliable.",
      rating: 4,
      fit: "true_to_size",
    });
    await createReviewForProduct(await createUser(), product, {
      title: "Hidden review",
      comment: "Moderation should hide this.",
      isApproved: false,
    });
    await updateProductReviewAggregates(product._id);

    const response = await request(app)
      .get(`/api/products/${product._id}/reviews`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      count: 1,
      total: 1,
      page: 1,
      limit: 20,
      pages: 1,
      summary: {
        averageRating: 4,
        reviewCount: 1,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 0 },
        fitSummary: {
          runsSmall: 0,
          trueToSize: 1,
          runsLarge: 0,
          total: 1,
          dominant: "true_to_size",
        },
      },
    });
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      rating: 4,
      title: "Clean daily shoe",
      comment: "The fit was reliable.",
      fit: "true_to_size",
      verifiedPurchase: true,
      user: { name: "Public Reviewer" },
    });
    expect(response.body.data[0].user.email).toBeUndefined();
  });

  it("requires bearer auth for review submission", async () => {
    const product = await createProduct();

    await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .send({
        rating: 5,
        title: "Great shoe",
        comment: "Comfortable and stable.",
      })
      .expect(401);
  });

  it("rejects review submission without a verified purchase", async () => {
    const user = await createUser();
    const product = await createProduct();

    const response = await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set(authHeader(user))
      .send({
        rating: 5,
        title: "Wanted to review",
        comment: "This should require a verified order.",
      })
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      message: "Reviews are available after a verified purchase",
    });
  });

  it("does not treat cancelled or unpaid orders as verified purchases", async () => {
    const user = await createUser();
    const product = await createProduct();
    await createVerifiedOrderFor(user, product, { status: "cancelled" });
    await createVerifiedOrderFor(user, product, { paymentStatus: "payment_pending" });

    await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set(authHeader(user))
      .send({
        rating: 4,
        title: "Blocked review",
        comment: "The order is not eligible.",
      })
      .expect(403);
  });

  it("validates review content as strict bounded plain text", async () => {
    const user = await createUser();
    const product = await createProduct();
    await createVerifiedOrderFor(user, product);

    const response = await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set(authHeader(user))
      .send({
        rating: 6,
        title: "",
        comment: "<script>alert('x')</script>",
        unexpected: "field",
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid request",
    });
    expect(await Review.countDocuments()).toBe(0);
  });

  it("creates a verified-purchase review and updates product aggregates", async () => {
    const user = await createUser({ name: "Verified Buyer" });
    const product = await createProduct({ rating: 0, reviewCount: 0 });
    await createVerifiedOrderFor(user, product);

    const response = await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set(authHeader(user))
      .send({
        rating: 5,
        title: "Excellent walking shoe",
        comment: "<script>alert('x')</script> still renders as plain text.",
        fit: "runs_large",
      })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      summary: {
        averageRating: 5,
        reviewCount: 1,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
        fitSummary: {
          runsSmall: 0,
          trueToSize: 0,
          runsLarge: 1,
          total: 1,
          dominant: "runs_large",
        },
      },
      data: {
        rating: 5,
        title: "Excellent walking shoe",
        comment: "<script>alert('x')</script> still renders as plain text.",
        fit: "runs_large",
        verifiedPurchase: true,
        user: { name: "Verified Buyer" },
      },
    });

    const updatedProduct = await Product.findById(product._id).lean();
    expect(updatedProduct).toMatchObject({
      rating: 5,
      reviewCount: 1,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
      fitSummary: {
        runsSmall: 0,
        trueToSize: 0,
        runsLarge: 1,
        total: 1,
        dominant: "runs_large",
      },
    });
  });

  it("returns 409 when the same user reviews the same product twice", async () => {
    const user = await createUser();
    const product = await createProduct();
    await createVerifiedOrderFor(user, product);

    const payload = {
      rating: 5,
      title: "First review",
      comment: "This should only be accepted once.",
    };

    await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set(authHeader(user))
      .send(payload)
      .expect(201);

    const response = await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set(authHeader(user))
      .send(payload)
      .expect(409);

    expect(response.body).toMatchObject({
      success: false,
      message: "You have already reviewed this product",
    });
  });
});
