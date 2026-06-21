import { describe, expect, it } from "vitest";
import {
  assertSafeSeedTarget,
  isLocalMongoUri,
  resolveAdminUser,
} from "../utils/seedData.js";

describe("seed data safety", () => {
  it("requires explicit seed admin credentials instead of default credentials", () => {
    expect(() =>
      resolveAdminUser({
        SEED_ADMIN_EMAIL: "",
        SEED_ADMIN_PASSWORD: "",
      })
    ).toThrow(/SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD/);

    expect(() =>
      resolveAdminUser({
        SEED_ADMIN_EMAIL: "admin@example.com",
        SEED_ADMIN_PASSWORD: "short",
      })
    ).toThrow(/at least 12 characters/);
  });

  it("builds the seed admin from environment-provided credentials", () => {
    expect(
      resolveAdminUser({
        SEED_ADMIN_NAME: " Store Admin ",
        SEED_ADMIN_EMAIL: "ADMIN@EXAMPLE.COM",
        SEED_ADMIN_PASSWORD: "strong-admin-password",
      })
    ).toEqual({
      name: "Store Admin",
      email: "admin@example.com",
      password: "strong-admin-password",
      isAdmin: true,
    });
  });

  it("refuses non-local MongoDB seed targets unless explicitly overridden", () => {
    expect(isLocalMongoUri("mongodb://localhost:27017/plashoe")).toBe(true);
    expect(isLocalMongoUri("mongodb://127.0.0.1:27017/plashoe")).toBe(true);
    expect(isLocalMongoUri("mongodb+srv://cluster.example/plashoe")).toBe(false);

    expect(() =>
      assertSafeSeedTarget({
        MONGO_URI: "mongodb+srv://cluster.example/plashoe",
      })
    ).toThrow(/Refusing to seed a non-local MongoDB URI/);

    expect(() =>
      assertSafeSeedTarget({
        MONGO_URI: "mongodb+srv://cluster.example/plashoe",
        ALLOW_NON_LOCAL_SEED: "true",
      })
    ).not.toThrow();
  });
});
