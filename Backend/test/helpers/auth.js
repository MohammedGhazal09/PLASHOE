import jwt from "jsonwebtoken";

export const authHeader = (user) => ({
  Authorization: `Bearer ${jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  })}`,
});
