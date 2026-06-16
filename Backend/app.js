import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { validateRuntimeEnv } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminOrderRoutes from "./routes/adminOrderRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import { requestContext } from "./middleware/requestContext.js";
import {
  apiLimiter,
  defaultJsonParser,
  handleApplicationErrors,
  handleSecurityErrors,
  securityHeaders,
  strictJsonParser,
} from "./middleware/security.js";
import { logWarn } from "./utils/logger.js";
import * as readiness from "./utils/readiness.js";

dotenv.config(
  process.env.DOTENV_CONFIG_PATH ? { path: process.env.DOTENV_CONFIG_PATH } : undefined
);

const app = express();
let runtimeInitializationPromise;

const initializeRuntime = async () => {
  validateRuntimeEnv(process.env);
  await connectDB();
};

const ensureRuntimeInitialized = async (req, res, next) => {
  if (process.env.NODE_ENV === "test") {
    next();
    return;
  }

  try {
    runtimeInitializationPromise ||= initializeRuntime();
    await runtimeInitializationPromise;
    next();
  } catch (error) {
    runtimeInitializationPromise = undefined;
    next(error);
  }
};

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
};

app.use(requestContext);
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use("/api", ensureRuntimeInitialized);
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhookRoutes);
app.use("/api", apiLimiter);

app.use("/api/auth", strictJsonParser, authRoutes);
app.use("/api/products", defaultJsonParser, productRoutes);
app.use("/api/cart", defaultJsonParser, cartRoutes);
app.use("/api/admin/orders", defaultJsonParser, adminOrderRoutes);
app.use("/api/orders", defaultJsonParser, orderRoutes);
app.use("/api/coupons/validate", strictJsonParser);
app.use("/api/coupons", defaultJsonParser, couponRoutes);
app.use("/api/contact", strictJsonParser, contactRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "PLASHOE API is running" });
});

app.get("/api/ready", (req, res) => {
  const status = readiness.getReadinessStatus();

  if (!status.ready) {
    logWarn("readiness-check-failed", {
      requestId: req.requestId,
      mongodbState: status.dependencies.mongodb.state,
    });
  }

  res.status(status.ready ? 200 : 503).json(status);
});

app.use(handleSecurityErrors);

app.use(handleApplicationErrors);

export default app;
