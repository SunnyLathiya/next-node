import asyncHandler from "../middleware/asyncHandler.js";
import * as authService from "../services/authService.js";

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json(result);
});

export const me = asyncHandler(async (req, res) => {
  res.status(200).json({ user: authService.getProfile(req.user) });
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken);
  res.status(200).json(result);
});

export const logout = asyncHandler(async (req, res) => {
  await authService.revoke(req.body.refreshToken);
  res.status(200).json({ message: "Logged out" });
});
