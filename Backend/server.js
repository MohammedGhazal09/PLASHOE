import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { validateRuntimeEnv } from "./config/env.js";
import app from "./app.js";
import { logError, logInfo, serializeError } from "./utils/logger.js";

dotenv.config(
  process.env.DOTENV_CONFIG_PATH ? { path: process.env.DOTENV_CONFIG_PATH } : undefined
);

export const startServer = async () => {
  let config;

  try {
    config = validateRuntimeEnv(process.env);
    logInfo("runtime-config-validated", {
      environment: process.env.NODE_ENV || "development",
      paymentsEnabled: config.paymentsEnabled,
      paymentProviderMode: config.paymentProviderMode,
    });
  } catch (error) {
    logError("runtime-config-validation-failed", {
      environment: process.env.NODE_ENV || "development",
      error: serializeError(error),
    });
    throw error;
  }

  await connectDB();

  return app.listen(config.port, () => {
    logInfo("server-listening", {
      port: config.port,
      environment: process.env.NODE_ENV || "development",
    });
  });
};

if (process.env.NODE_ENV !== "test" && process.env.VERCEL !== "1") {
  startServer().catch(() => {
    process.exitCode = 1;
  });
}

export default app;
