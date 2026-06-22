import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app.js";
import Product from "../models/Product.js";
import { createProduct } from "./helpers/factories.js";
import { createProductSchema } from "../validators/product.js";

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

  it("supports bounded search with size, price, rating, and sale filters", async () => {
    await createProduct({
      name: "Trail Runner",
      gender: "male",
      category: "Running",
      description: "Light trail shoe with a recycled mesh upper",
      sizes: [40, 41, 42],
      price: { original: 140, current: 95 },
      rating: 4.7,
      isOnSale: true,
      image: "/images/trail-runner.jpg",
    });
    await createProduct({
      name: "Road Runner",
      gender: "male",
      category: "Running",
      description: "Road training shoe",
      sizes: [43, 44],
      price: { original: 120, current: 105 },
      rating: 4.8,
      isOnSale: true,
      image: "/images/road-runner.jpg",
    });
    await createProduct({
      name: "Trail Classic",
      gender: "female",
      category: "Classic",
      description: "Retro trail-inspired court shoe",
      sizes: [41],
      price: { original: 110, current: 80 },
      rating: 3.9,
      isOnSale: true,
      image: "/images/trail-classic.jpg",
    });
    await Product.init();

    const response = await request(app)
      .get("/api/products")
      .query({
        q: "trail",
        gender: "male",
        sale: "true",
        size: 41,
        minPrice: 90,
        maxPrice: 100,
        minRating: 4,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      count: 1,
      total: 1,
      page: 1,
      limit: 20,
      pages: 1,
    });
    expect(response.body.data[0].name).toBe("Trail Runner");
  });

  it("matches partial search terms across collection and gender catalog routes", async () => {
    await createProduct({
      name: "Men Chelsea Boot",
      gender: "male",
      category: "Classic",
      description: "Polished ankle boot",
      image: "/images/men-chelsea-boot.jpg",
    });
    await createProduct({
      name: "Women Ankle Boot",
      gender: "female",
      category: "Classic",
      description: "Soft leather boot",
      image: "/images/women-ankle-boot.jpg",
    });
    await createProduct({
      name: "Road Sneaker",
      gender: "male",
      category: "Sneaker",
      description: "Daily walking shoe",
      image: "/images/road-sneaker.jpg",
    });
    await Product.init();

    const collectionResponse = await request(app)
      .get("/api/products")
      .query({ q: "boo" })
      .expect(200);
    expect(collectionResponse.body).toMatchObject({ count: 2, total: 2 });
    expect(collectionResponse.body.data.map((product) => product.name)).toEqual(
      expect.arrayContaining(["Men Chelsea Boot", "Women Ankle Boot"])
    );

    const menResponse = await request(app)
      .get("/api/products/men")
      .query({ q: "chel" })
      .expect(200);
    expect(menResponse.body).toMatchObject({ count: 1, total: 1 });
    expect(menResponse.body.data[0].name).toBe("Men Chelsea Boot");

    const womenResponse = await request(app)
      .get("/api/products/women")
      .query({ q: "ANK" })
      .expect(200);
    expect(womenResponse.body).toMatchObject({ count: 1, total: 1 });
    expect(womenResponse.body.data[0].name).toBe("Women Ankle Boot");
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

  it("validates advanced catalog query bounds", async () => {
    const response = await request(app)
      .get("/api/products")
      .query({
        q: "x".repeat(81),
        size: 50,
        minPrice: 200,
        maxPrice: 100,
        minRating: 6,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid request",
    });
    expect(response.body.errors.map((error) => error.path)).toEqual(
      expect.arrayContaining(["q", "size", "minPrice", "minRating"])
    );
  });

  it("declares indexes that support catalog filters and sort options", () => {
    const indexFields = Product.schema.indexes().map(([fields]) => fields);

    expect(indexFields).toEqual(
      expect.arrayContaining([
        { gender: 1, category: 1, createdAt: -1 },
        { isOnSale: 1, createdAt: -1 },
        { sizes: 1 },
        { "price.current": 1 },
        { rating: -1 },
        { createdAt: -1 },
        { name: "text", category: "text", description: "text" },
      ])
    );
  });

  it("validates source-backed sustainability content", () => {
    const baseProduct = {
      name: "Evidence Runner",
      gender: "male",
      category: "Running",
      image: "/images/evidence-runner.jpg",
      price: { original: 120, current: 100 },
    };

    expect(() =>
      createProductSchema.parse({
        ...baseProduct,
        sustainability: {
          summary: "Upper material includes recycled textile.",
        },
      })
    ).toThrow(/Sustainability source is required/);

    expect(() =>
      createProductSchema.parse({
        ...baseProduct,
        sustainability: {
          impactMetrics: [{ label: "Recycled upper textile", value: "Documented", source: "" }],
        },
      })
    ).toThrow(/Impact metric source is required/);

    const parsed = createProductSchema.parse({
      ...baseProduct,
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
        manufacturing: {
          location: "Portugal",
          source: "Supplier onboarding record",
        },
        durability: {
          summary: "Care-tested for everyday city wear.",
          source: "PLASHOE care standard",
        },
      },
    });

    expect(parsed.sustainability.summary).toBe(
      "Upper material includes supplier-documented recycled textile."
    );
  });
});
