import { afterEach, describe, expect, it, vi } from "vitest";
import connectDB from "../config/db.js";

const { connectMock, connectionState } = vi.hoisted(() => ({
  connectMock: vi.fn(),
  connectionState: { readyState: 1 },
}));

vi.mock("mongoose", () => ({
  __esModule: true,
  default: {
    connect: connectMock,
    connection: connectionState,
  },
}));

const mongoUri = "mongodb://localhost:27017/plashoe-test";

const expectConnectCall = (timeoutMs) => {
  expect(connectMock).toHaveBeenCalledWith(mongoUri, {
    serverSelectionTimeoutMS: timeoutMs,
  });
};

afterEach(() => {
  vi.restoreAllMocks();
  connectMock.mockReset();
  delete process.env.MONGO_URI;
  delete process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS;
  connectionState.readyState = 1;
});

describe("connectDB", () => {
  it("uses the default server selection timeout when the env var is missing", async () => {
    process.env.MONGO_URI = mongoUri;
    connectMock.mockResolvedValueOnce({ connection: { readyState: 1 } });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await connectDB();

    expect(result).toEqual({ connected: true });
    expectConnectCall(5000);
    expect(logSpy).toHaveBeenCalled();
  });

  it("uses the configured server selection timeout when it is valid", async () => {
    process.env.MONGO_URI = mongoUri;
    process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS = "12000";
    connectMock.mockResolvedValueOnce({ connection: { readyState: 1 } });
    vi.spyOn(console, "log").mockImplementation(() => {});

    await connectDB();

    expectConnectCall(12000);
  });

  it("falls back to the default timeout when the env var is invalid", async () => {
    process.env.MONGO_URI = mongoUri;
    process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS = "0";
    connectMock.mockResolvedValueOnce({ connection: { readyState: 1 } });
    vi.spyOn(console, "log").mockImplementation(() => {});

    await connectDB();

    expectConnectCall(5000);
  });
});
