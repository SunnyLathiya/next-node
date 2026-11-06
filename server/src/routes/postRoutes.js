import { Router } from "express";
import {
  createPost,
  deletePost,
  getPost,
  listPosts,
  reactToPost,
  updatePost,
} from "../controllers/postController.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  postQuerySchema,
  postSchema,
  reactionSchema,
} from "../validators/schemas.js";

const router = Router();

router.get("/", optionalAuth, validate(postQuerySchema, "query"), listPosts);
router.get("/:id", optionalAuth, getPost);
router.post("/", requireAuth, validate(postSchema), createPost);
router.put("/:id", requireAuth, validate(postSchema), updatePost);
router.delete("/:id", requireAuth, deletePost);
router.post(
  "/:id/reactions",
  requireAuth,
  validate(reactionSchema),
  reactToPost,
);

export default router;
