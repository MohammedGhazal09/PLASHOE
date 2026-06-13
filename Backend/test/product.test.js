import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app.js";
import Product from "../models/Product.js";
import { createProduct } from "./helpers/factories.js";

describe("product catalog routes", () => {
  it("returns a bounded paginated product envelope by default", async () => {
    await Promise.all(
      Array.from({ length: 25 }, (_, index) =>
        createProduct({
          name: `Default Shoe ${index}`,
          image: `/images/default-shoe-${index}.jpg`,
        })
      )
    );

    const response = await request(app).get("/api/products").expect(200);

    expect(response.body).toMatchObject({
      success: true,
      count: 20,
      total: 25,
      page: 1,
      limit: 20,
      pages: 2,
    });
    expect(response.body.data).toHaveLength(20);
  });

  it("filters, sorts, and paginates the root catalog endpoint", async () => {
    await createProduct({
      name: "High Price Runner",
      gender: "male",
      category: "Running",
      price: { original: 180, current: 160 },
      image: "/images/high-price-runner.jpg",
    });
    await createProduct({
      name: "Low Price Runner",
      gender: "male",
      category: "Running",
      price: { original: 120, current: 80 },
      image: "/images/low-price-runner.jpg",
    });
    await createProduct({
      name: "Female Runner",
      gender: "female",
      category: "Running",
      price: { original: 130, current: 90 },
      image: "/images/female-runner.jpg",
    });

    const response = await request(app)
      .get("/api/products")
      .query({ gender: "male", category: "Running", sort: "price-asc", limit: 1, page: 1 })
      .expect(200);

    expect(response.body).toMatchObject({
      count: 1,
      total: 2,
      page: 1,
      limit: 1,
      pages: 2,
    });
    expect(response.body.data[0].name).toBe("Low Price Runner");
  });

  it("returns paginated envelopes from legacy gender and sale routes", async () => {
    await Promise.all(
      Array.from({ length: 22 }, (_, index) =>
        createProduct({
          name: `Male Shoe ${index}`,
          gender: "male",
          image: `/images/male-shoe-${index}.jpg`,
        })
      )
    );
    await Promise.all(
      Array.from({ length: 3 }, (_, index) =>
        createProduct({
          name: `Female Shoe ${index}`,
          gender: "female",
          image: `/images/female-shoe-${index}.jpg`,
        })
      )
    );
    await createProduct({
      name: "Sale Shoe",
      isOnSale: true,
      image: "/images/sale-shoe.jpg",
    });

    const menResponse = await request(app).get("/api/products/men").expect(200);
    expect(menResponse.body).toMatchObject({
      count: 20,
      total: 23,
      page: 1,
      limit: 20,
      pages: 2,
    });
    expect(menResponse.body.data.every((product) => product.gender === "male")).toBe(true);

    const womenResponse = await request(app)
      .get("/api/products/women")
      .query({ limit: 2 })
      .expect(200);
    expect(womenResponse.body).toMatchObject({
      count: 2,
      total: 3,
      page: 1,
      limit: 2,
      pages: 2,
    });
    expect(womenResponse.body.data.every((product) => product.gender === "female")).toBe(true);

    const saleResponse = await request(app)
      .get("/api/products/sale")
      .query({ limit: 2 })
      .expect(200);
    expect(saleResponse.body).toMatchObject({
      count: 1,
      total: 1,
      page: 1,
      limit: 2,
      pages: 1,
    });
    expect(saleResponse.body.data.every((product) => product.isOnSale)).toBe(true);
  });

  it("validates legacy list route query parameters before querying", async () => {
    const response = await request(app)
      .get("/api/products/men")
      .query({ sort: "name", unexpected: "field" })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid request",
    });
  });

  it("declares indexes that support catalog filters and sort options", () => {
    const indexFields = Product.schema.indexes().map(([fields]) => fields);

    expect(indexFields).toEqual(
      expect.arrayContaining([
        { gender: 1, category: 1, createdAt: -1 },
        { isOnSale: 1, createdAt: -1 },
        { "price.current": 1 },
        { rating: -1 },
        { createdAt: -1 },
      ])
    );
  });
});
