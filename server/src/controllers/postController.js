import asyncHandler from "../middleware/asyncHandler.js";
import * as postService from "../services/postService.js";

export const listPosts = asyncHandler(async (req, res) => {
  const result = await postService.listPostsAggregation(
    req.validatedQuery,
    req.user?._id,
  );
  res.status(200).json(result);
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await postService.getPost(req.params.id, req.user?._id);
  res.status(200).json(post);
});

export const createPost = asyncHandler(async (req, res) => {
  const post = await postService.createPost(req.body, req.user._id);
  res.status(201).json(post);
});

export const updatePost = asyncHandler(async (req, res) => {
  const post = await postService.updatePost(
    req.params.id,
    req.body,
    req.user._id,
  );
  res.status(200).json(post);
});

export const deletePost = asyncHandler(async (req, res) => {
  const result = await postService.deletePost(req.params.id, req.user._id);
  res.status(200).json(result);
});

export const reactToPost = asyncHandler(async (req, res) => {
  const post = await postService.reactToPost(
    req.params.id,
    req.user._id,
    req.body.type,
  );
  res.status(200).json(post);
});
