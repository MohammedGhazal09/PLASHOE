import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const configuredOrigin = "https://shop.example";

let app;
let envDir;
let originalFrontendUrl;
let originalDotenvPath;

describe("cors configuration", () => {
  beforeAll(async () => {
    envDir = mkdtempSync(join(tmpdir(), "plashoe-env-"));
    const envPath = join(envDir, ".env");
    originalFrontendUrl = process.env.FRONTEND_URL;
    originalDotenvPath = process.env.DOTENV_CONFIG_PATH;

    writeFileSync(envPath, `FRONTEND_URL=${configuredOrigin}\n`);
    delete process.env.FRONTEND_URL;
    process.env.DOTENV_CONFIG_PATH = envPath;

    ({ default: app } = await import("../app.js"));
  });

  afterAll(() => {
    if (originalFrontendUrl === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = originalFrontendUrl;
    }

    if (originalDotenvPath === undefined) {
      delete process.env.DOTENV_CONFIG_PATH;
    } else {
      process.env.DOTENV_CONFIG_PATH = originalDotenvPath;
    }

    rmSync(envDir, { recursive: true, force: true });
  });

  it("loads FRONTEND_URL from dotenv before configuring CORS", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", configuredOrigin)
      .expect(200);

    expect(response.headers["access-control-allow-origin"]).toBe(configuredOrigin);
  });
});
