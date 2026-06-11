import { Router } from "express";

import { create, getById, list } from "../controllers/monitored-person.controller.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createMonitoredPersonSchema, monitoredPersonIdParamSchema } from "../schemas/monitored-person.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const monitoredPersonRouter = Router();

monitoredPersonRouter.use(requireAuth);
monitoredPersonRouter.get("/", requireRoles("ADMIN", "CAREGIVER"), asyncHandler(list));
monitoredPersonRouter.post("/", requireRoles("ADMIN", "CAREGIVER"), validate(createMonitoredPersonSchema), asyncHandler(create));
monitoredPersonRouter.get("/:id", requireRoles("ADMIN", "CAREGIVER"), validate(monitoredPersonIdParamSchema), asyncHandler(getById));
