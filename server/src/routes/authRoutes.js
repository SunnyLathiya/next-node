import { Router } from "express";
import { login, logout, me, refresh, register } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  loginSchema,
  refreshSchema,
  registerSchema,
} from "../validators/schemas.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh);
router.post("/logout", validate(refreshSchema), logout);
router.get("/me", requireAuth, me);

export default router;
