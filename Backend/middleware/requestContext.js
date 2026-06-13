import { randomUUID } from "node:crypto";
import { logInfo } from "../utils/logger.js";

const REQUEST_ID_HEADER = "X-Request-Id";
const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

export const getSafeRequestId = (value) => {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return SAFE_REQUEST_ID.test(trimmed) ? trimmed : null;
};

export const requestContext = (req, res, next) => {
  const startedAt = process.hrtime.bigint();
  const inboundRequestId = getSafeRequestId(req.get(REQUEST_ID_HEADER));
  const requestId = inboundRequestId || randomUUID();

  req.requestId = requestId;
  res.set(REQUEST_ID_HEADER, requestId);

  res.on("finish", () => {
    const path = req.path || req.originalUrl || "";

    if (!path.startsWith("/api") || path === "/api/health") {
      return;
    }

    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    logInfo("api-request-completed", {
      requestId,
      method: req.method,
      path,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    });
  });

  next();
};
