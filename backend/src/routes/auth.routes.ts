import { Router } from "express";

import { getMe, login, register, signup } from "../controllers/auth.controller.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { loginSchema, registerSchema, signupSchema } from "../schemas/auth.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const authRouter = Router();

authRouter.post("/signup", validate(signupSchema), asyncHandler(signup));
authRouter.post("/login", validate(loginSchema), asyncHandler(login));
authRouter.post("/register", requireAuth, requireRoles("ADMIN"), validate(registerSchema), asyncHandler(register));
authRouter.get("/me", requireAuth, getMe);
