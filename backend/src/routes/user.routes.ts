import { Router } from "express";

import { deactivate, list, reactivate, remove, resetPassword } from "../controllers/user.controller.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { resetUserPasswordSchema, userIdParamSchema } from "../schemas/user.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const userRouter = Router();

userRouter.use(requireAuth, requireRoles("ADMIN"));
userRouter.get("/", asyncHandler(list));
userRouter.patch("/:id/deactivate", validate(userIdParamSchema), asyncHandler(deactivate));
userRouter.patch("/:id/reactivate", validate(userIdParamSchema), asyncHandler(reactivate));
userRouter.patch("/:id/password", validate(resetUserPasswordSchema), asyncHandler(resetPassword));
userRouter.delete("/:id", validate(userIdParamSchema), asyncHandler(remove));
