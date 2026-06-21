import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../app.js";
import { createProduct } from "./helpers/factories.js";

describe("product detail and related products", () => {
  it("returns richer optional product detail fields", async () => {
    const product = await createProduct({
      name: "Detail Runner",
      description: "A breathable runner for long city walks.",
      gallery: ["/images/detail-runner-1.jpg", "/images/detail-runner-2.jpg"],
      materials: [{ label: "Upper", value: "Recycled knit" }],
      careInstructions: ["Spot clean only"],
      fitGuide: {
        summary: "Runs true to size for most shoppers.",
        sizeNote: "Choose your usual EU size.",
        width: "Standard",
        archSupport: "Medium",
      },
      sustainability: {
        summary: "Upper material includes supplier-documented recycled textile.",
        source: "Supplier material declaration",
        impactMetrics: [
          {
            label: "Recycled upper textile",
            value: "Documented",
            source: "Supplier material declaration",
          },
        ],
        certifications: [
          {
            name: "Material declaration",
            issuer: "PLASHOE supplier compliance",
            url: "https://example.test/material-declaration",
          },
        ],
        manufacturing: {
          location: "Portugal",
          facility: "Partner workshop",
          process: "Cut, stitch, and finish.",
          source: "Supplier onboarding record",
        },
        durability: {
          summary: "Care-tested for everyday city wear.",
          repairability: "Replaceable laces.",
          expectedUse: "Everyday walking when cleaned as instructed.",
          source: "PLASHOE care standard",
        },
      },
      reviewCount: 2,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
      fitSummary: {
        runsSmall: 0,
        trueToSize: 2,
        runsLarge: 0,
        total: 2,
        dominant: "true_to_size",
      },
    });

    const response = await request(app)
      .get(`/api/products/${product._id}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        _id: product._id.toString(),
        name: "Detail Runner",
        description: "A breathable runner for long city walks.",
        gallery: ["/images/detail-runner-1.jpg", "/images/detail-runner-2.jpg"],
        materials: [{ label: "Upper", value: "Recycled knit" }],
        careInstructions: ["Spot clean only"],
        fitGuide: {
          summary: "Runs true to size for most shoppers.",
          sizeNote: "Choose your usual EU size.",
          width: "Standard",
          archSupport: "Medium",
        },
        sustainability: {
          summary: "Upper material includes supplier-documented recycled textile.",
          source: "Supplier material declaration",
          impactMetrics: [
            {
              label: "Recycled upper textile",
              value: "Documented",
              source: "Supplier material declaration",
            },
          ],
          certifications: [
            {
              name: "Material declaration",
              issuer: "PLASHOE supplier compliance",
              url: "https://example.test/material-declaration",
            },
          ],
          manufacturing: {
            location: "Portugal",
            facility: "Partner workshop",
            process: "Cut, stitch, and finish.",
            source: "Supplier onboarding record",
          },
          durability: {
            summary: "Care-tested for everyday city wear.",
            repairability: "Replaceable laces.",
            expectedUse: "Everyday walking when cleaned as instructed.",
            source: "PLASHOE care standard",
          },
        },
        reviewCount: 2,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
        fitSummary: {
          runsSmall: 0,
          trueToSize: 2,
          runsLarge: 0,
          total: 2,
          dominant: "true_to_size",
        },
      },
    });
  });

  it("returns deterministic related products without the current product", async () => {
    const target = await createProduct({
      name: "Target Runner",
      gender: "male",
      category: "Running",
      rating: 2,
    });
    const sameGenderCategory = await createProduct({
      name: "Same Gender Running",
      gender: "male",
      category: "Running",
      rating: 3,
    });
    const sameCategory = await createProduct({
      name: "Female Running",
      gender: "female",
      category: "Running",
      rating: 5,
    });
    const fallback = await createProduct({
      name: "Classic Fallback",
      gender: "male",
      category: "Classic",
      rating: 5,
    });

    const response = await request(app)
      .get(`/api/products/${target._id}/related`)
      .query({ limit: 3 })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      count: 3,
    });
    expect(response.body.data.map((product) => product._id)).toEqual([
      sameGenderCategory._id.toString(),
      sameCategory._id.toString(),
      fallback._id.toString(),
    ]);
    expect(response.body.data.map((product) => product._id)).not.toContain(
      target._id.toString()
    );
  });

  it("validates related product params and limit before querying", async () => {
    await request(app).get("/api/products/not-an-id/related").expect(400);

    await request(app)
      .get(`/api/products/${new mongoose.Types.ObjectId()}/related`)
      .query({ limit: 9 })
      .expect(400);
  });

  it("returns 404 for related products when the source product is missing", async () => {
    const response = await request(app)
      .get(`/api/products/${new mongoose.Types.ObjectId()}/related`)
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: "Product not found",
    });
  });
});
