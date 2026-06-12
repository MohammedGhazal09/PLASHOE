import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../app.js";
import ContactMessage from "../models/ContactMessage.js";

describe("contact routes", () => {
  it("stores a public contact submission", async () => {
    const response = await request(app)
      .post("/api/contact")
      .send({
        name: "Contact User",
        email: "contact@example.com",
        subject: "Sizing question",
        message: "Do you ship to Riyadh?",
      })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      message: "Message sent successfully",
    });
    expect(response.body.data).toMatchObject({
      name: "Contact User",
      email: "contact@example.com",
      subject: "Sizing question",
      message: "Do you ship to Riyadh?",
      isRead: false,
    });

    const stored = await ContactMessage.findById(response.body.data._id);
    expect(stored).toMatchObject({
      name: "Contact User",
      email: "contact@example.com",
      subject: "Sizing question",
      message: "Do you ship to Riyadh?",
      isRead: false,
    });
  });

  it("rejects contact submissions missing required fields", async () => {
    const response = await request(app)
      .post("/api/contact")
      .send({
        name: "Contact User",
        email: "contact@example.com",
      })
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: "Name, email and message are required",
    });
  });
});
