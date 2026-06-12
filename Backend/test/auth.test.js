import request from "supertest";
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import app from "../app.js";
import { authHeader } from "./helpers/auth.js";
import { createUser } from "./helpers/factories.js";

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
