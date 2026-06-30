import request from "supertest";
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import app from "../app.js";
import { authHeader } from "./helpers/auth.js";
import { createUser, validShippingAddress } from "./helpers/factories.js";

describe("auth routes", () => {
  it("registers a new user and returns an auth token", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "New Buyer",
        email: "new-buyer@example.com",
        password: "password123",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      name: "New Buyer",
      email: "new-buyer@example.com",
      isAdmin: false,
    });
    expect(response.body.data._id).toBeTruthy();
    expect(response.body.data.token).toEqual(expect.any(String));

    const decoded = jwt.decode(response.body.data.token, { complete: true });
    expect(decoded.header.alg).toBe("HS256");
    expect(decoded.payload.exp - decoded.payload.iat).toBe(60 * 60);
  });

  it("rejects duplicate registration", async () => {
    await createUser({ email: "duplicate@example.com" });

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Duplicate Buyer",
        email: "duplicate@example.com",
        password: "password123",
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "User already exists",
    });
  });

  it("rejects unknown public registration fields", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Injected Buyer",
        email: "injected@example.com",
        password: "password123",
        isAdmin: true,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid request",
    });
  });

  it("logs in an existing user and returns an auth token", async () => {
    const user = await createUser({
      email: "login@example.com",
      password: "secret123",
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: user.email,
        password: "secret123",
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      name: user.name,
      email: user.email,
      isAdmin: false,
    });
    expect(response.body.data.token).toEqual(expect.any(String));
  });

  it("rejects invalid login credentials", async () => {
    const user = await createUser({
      email: "invalid-login@example.com",
      password: "secret123",
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: user.email,
        password: "wrong-password",
      })
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid credentials",
    });
  });

  it("returns the current user for a valid bearer token", async () => {
    const user = await createUser({ email: "me@example.com" });

    const response = await request(app)
      .get("/api/auth/me")
      .set(authHeader(user))
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
    });
    expect(response.body.data.password).toBeUndefined();
  });

  it("updates profile through sanitized allowlisted fields", async () => {
    const user = await createUser({ email: "profile@example.com" });

    const response = await request(app)
      .put("/api/auth/profile")
      .set(authHeader(user))
      .send({
        name: "  Updated Buyer  ",
        phone: " 5551234567 ",
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      name: "Updated Buyer",
      email: "profile@example.com",
      phone: "5551234567",
    });
  });

  it("clears optional profile phone when an empty value is submitted", async () => {
    const user = await createUser({
      email: "profile-clear-phone@example.com",
      phone: "5551234567",
    });

    const response = await request(app)
      .put("/api/auth/profile")
      .set(authHeader(user))
      .send({
        phone: "",
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.phone).toBe("");
  });

  it("rejects profile email changes without a verified email-change flow", async () => {
    const user = await createUser({ email: "profile-email@example.com" });

    const response = await request(app)
      .put("/api/auth/profile")
      .set(authHeader(user))
      .send({
        email: "takeover@example.com",
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid request",
    });

    await request(app)
      .post("/api/auth/login")
      .send({
        email: "takeover@example.com",
        password: "password123",
      })
      .expect(401);

    await request(app)
      .post("/api/auth/login")
      .send({
        email: user.email,
        password: "password123",
      })
      .expect(200);
  });

  it("rejects unknown profile fields including isAdmin", async () => {
    const user = await createUser({ email: "profile-extra@example.com" });

    const response = await request(app)
      .put("/api/auth/profile")
      .set(authHeader(user))
      .send({
        name: "Injected Admin",
        isAdmin: true,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid request",
    });
  });

  it("adds addresses through sanitized allowlisted fields", async () => {
    const user = await createUser({ email: "address@example.com" });

    const response = await request(app)
      .post("/api/auth/addresses")
      .set(authHeader(user))
      .send({
        firstName: " Test ",
        lastName: " Buyer ",
        country: " United States ",
        street: " 123 Test Street ",
        city: " Testville ",
        state: " CA ",
        zipCode: " 90210 ",
        phone: " 5551234567 ",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data[0]).toMatchObject({
      firstName: "Test",
      lastName: "Buyer",
      country: "United States",
      street: "123 Test Street",
      city: "Testville",
      state: "CA",
      zipCode: "90210",
      phone: "5551234567",
      isDefault: true,
    });
    expect(response.body.data[0].isAdmin).toBeUndefined();
  });

  it("rejects unknown address fields", async () => {
    const user = await createUser({ email: "address-extra@example.com" });

    const response = await request(app)
      .post("/api/auth/addresses")
      .set(authHeader(user))
      .send({
        firstName: "Test",
        lastName: "Buyer",
        country: "United States",
        street: "123 Test Street",
        city: "Testville",
        state: "CA",
        zipCode: "90210",
        phone: "5551234567",
        deliveryInstructions: "Persist me",
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid request",
    });
  });

  it("sets an existing address as the default address", async () => {
    const user = await createUser({
      email: "address-default@example.com",
      addresses: [
        validShippingAddress({ firstName: "Primary", isDefault: true }),
        validShippingAddress({ firstName: "Work", street: "456 Work Street", isDefault: false }),
      ],
    });
    const workAddressId = user.addresses[1]._id.toString();

    const response = await request(app)
      .put(`/api/auth/addresses/${workAddressId}/default`)
      .set(authHeader(user))
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data.find((address) => address.firstName === "Primary")).toMatchObject({
      isDefault: false,
    });
    expect(response.body.data.find((address) => address.firstName === "Work")).toMatchObject({
      isDefault: true,
    });
  });

  it("promotes another address when deleting the default address", async () => {
    const user = await createUser({
      email: "address-delete-default@example.com",
      addresses: [
        validShippingAddress({ firstName: "Home", isDefault: true }),
        validShippingAddress({ firstName: "Office", street: "789 Office Street", isDefault: false }),
      ],
    });
    const defaultAddressId = user.addresses[0]._id.toString();

    const response = await request(app)
      .delete(`/api/auth/addresses/${defaultAddressId}`)
      .set(authHeader(user))
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      firstName: "Office",
      isDefault: true,
    });
  });

  it("rejects default selection for an address outside the account", async () => {
    const user = await createUser({
      email: "address-missing-default@example.com",
      addresses: [validShippingAddress({ isDefault: true })],
    });

    const response = await request(app)
      .put("/api/auth/addresses/64f000000000000000000001/default")
      .set(authHeader(user))
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: "Address not found",
    });
  });

  it("rejects missing bearer tokens on protected routes", async () => {
    const response = await request(app).get("/api/auth/me").expect(401);

    expect(response.body).toMatchObject({
      success: false,
      message: "Not authorized, no token",
    });
  });

  it("rejects invalid bearer tokens on protected routes", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      message: "Not authorized, token failed",
    });
  });

  it("rejects bearer tokens signed with a disallowed algorithm", async () => {
    const user = await createUser({ email: "wrong-algorithm@example.com" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      algorithm: "HS512",
      expiresIn: "1h",
    });

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      message: "Not authorized, token failed",
    });
  });
});
