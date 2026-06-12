import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { validateRuntimeEnv } from "./config/env.js";
import app from "./app.js";

dotenv.config(
  process.env.DOTENV_CONFIG_PATH ? { path: process.env.DOTENV_CONFIG_PATH } : undefined
);

const config = validateRuntimeEnv(process.env);

connectDB();

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
