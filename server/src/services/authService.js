import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const toPublicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
});

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const unauthorized = (message) => {
  const error = new Error(message);
  error.statusCode = 401;
  return error;
};

const issueSession = async (user) => {
  const id = String(user._id);
  const token = jwt.sign({ id, type: "access" }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m",
  });
  const refreshToken = jwt.sign(
    {
      id,
      email: user.email,
      type: "refresh",
      jti: crypto.randomBytes(16).toString("hex"),
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d" },
  );
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  return { token, refreshToken, user: toPublicUser(user) };
};

const readRefreshPayload = (refreshToken) => {
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (payload.type !== "refresh" || !payload.id) {
      throw unauthorized("Invalid or expired session");
    }
    return payload;
  } catch (error) {
    if (error.statusCode) throw error;
    throw unauthorized("Invalid or expired session");
  }
};

export const register = async ({ name, email, password }) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    const error = new Error("An account with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashed,
  });

  return issueSession(user);
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );
  if (!user) throw unauthorized("Invalid email or password");

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) throw unauthorized("Invalid email or password");

  return issueSession(user);
};

export const refresh = async (refreshToken) => {
  const payload = readRefreshPayload(refreshToken);
  const user = await User.findOne({
    _id: payload.id,
    refreshTokenHash: hashToken(refreshToken),
  });
  if (!user) throw unauthorized("Invalid or expired session");
  return issueSession(user);
};

export const revoke = async (refreshToken) => {
  if (!refreshToken) return;
  await User.updateOne(
    { refreshTokenHash: hashToken(refreshToken) },
    { $unset: { refreshTokenHash: 1 } },
  );
};

export const getProfile = (user) => toPublicUser(user);
