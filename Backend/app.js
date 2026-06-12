import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import {
  apiLimiter,
  defaultJsonParser,
  handleApplicationErrors,
  handleSecurityErrors,
  securityHeaders,
  strictJsonParser,
} from "./middleware/security.js";

dotenv.config(
  process.env.DOTENV_CONFIG_PATH ? { path: process.env.DOTENV_CONFIG_PATH } : undefined
);

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
};

app.use(securityHeaders);
app.use(cors(corsOptions));
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhookRoutes);
app.use("/api", apiLimiter);

app.use("/api/auth", strictJsonParser, authRoutes);
app.use("/api/products", defaultJsonParser, productRoutes);
app.use("/api/cart", defaultJsonParser, cartRoutes);
app.use("/api/orders", defaultJsonParser, orderRoutes);
app.use("/api/coupons/validate", strictJsonParser);
app.use("/api/coupons", defaultJsonParser, couponRoutes);
app.use("/api/contact", strictJsonParser, contactRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "PLASHOE API is running" });
});

app.use(handleSecurityErrors);

app.use(handleApplicationErrors);

export default app;
