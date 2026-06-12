import jwt from "jsonwebtoken";
import { JWT_SECURITY } from "../../config/security.js";

export const authHeader = (user) => ({
  Authorization: `Bearer ${jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    algorithm: JWT_SECURITY.algorithm,
    expiresIn: process.env.JWT_EXPIRE || JWT_SECURITY.defaultExpiresIn,
  })}`,
});
