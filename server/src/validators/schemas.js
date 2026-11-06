import joi from "joi";

export const registerSchema = joi.object({
  name: joi.string().trim().min(2).max(50).required().messages({
    "string.min": "Name must be at least 2 characters",
    "string.empty": "Name is required",
    "any.required": "Name is required",
  }),
  email: joi.string().trim().email().required().messages({
    "string.email": "Enter a valid email",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
  password: joi.string().min(6).max(100).required().messages({
    "string.min": "Password must be at least 6 characters",
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
});

export const refreshSchema = joi.object({
  refreshToken: joi.string().required().messages({
    "string.empty": "Refresh token is required",
    "any.required": "Refresh token is required",
  }),
});

export const loginSchema = joi.object({
  email: joi.string().trim().email().required().messages({
    "string.email": "Enter a valid email",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
  password: joi.string().required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
});

export const postSchema = joi.object({
  title: joi.string().trim().min(3).max(120).required().messages({
    "string.min": "Title must be at least 3 characters",
    "string.max": "Title must be at most 120 characters",
    "string.empty": "Title is required",
    "any.required": "Title is required",
  }),
  content: joi.string().trim().min(10).max(5000).required().messages({
    "string.min": "Content must be at least 10 characters",
    "string.max": "Content must be at most 5000 characters",
    "string.empty": "Content is required",
    "any.required": "Content is required",
  }),
  isPublic: joi.boolean().default(true),
});

export const postQuerySchema = joi.object({
  search: joi.string().trim().allow("").max(100).default(""),
  sort: joi.string().valid("newest", "oldest", "mostLiked").default("newest"),
  mine: joi.boolean().default(false),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(20).default(6),
});

export const reactionSchema = joi.object({
  type: joi.string().valid("like", "dislike").required().messages({
    "any.only": "Reaction must be like or dislike",
    "any.required": "Reaction type is required",
  }),
});
