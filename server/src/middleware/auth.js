import jwt from "jsonwebtoken";
import User from "../models/User.js";

const unauthorized = () => {
  const error = new Error("Authentication required");
  error.statusCode = 401;
  return error;
};

const readToken = (req) => {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = readToken(req);
    if (!token) throw unauthorized();

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== "access") throw unauthorized();
    const user = await User.findById(payload.id);
    if (!user) throw unauthorized();

    req.user = user;
    next();
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 401;
      error.message = "Invalid or expired token";
    }
    next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  const token = readToken(req);
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== "access") throw unauthorized();
    const user = await User.findById(payload.id);
    if (!user) throw unauthorized();
    req.user = user;
    next();
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 401;
      error.message = "Invalid or expired token";
    }
    next(error);
  }
};
