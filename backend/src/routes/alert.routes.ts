import { Router } from "express";

import { getAlertById, getAlerts, resolveAlertById } from "../controllers/alert.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { alertIdParamSchema, listAlertsSchema, resolveAlertSchema } from "../schemas/alert.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const alertRouter = Router();

alertRouter.get("/", requireAuth, validate(listAlertsSchema), asyncHandler(getAlerts));
alertRouter.get("/:id", requireAuth, validate(alertIdParamSchema), asyncHandler(getAlertById));
alertRouter.patch("/:id/resolve", requireAuth, validate(resolveAlertSchema), asyncHandler(resolveAlertById));

