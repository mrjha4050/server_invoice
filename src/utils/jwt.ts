import jwt from "jsonwebtoken";

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || "secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
};

export const verifyToken = (token: string): object | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    if (typeof decoded === "string") {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
};