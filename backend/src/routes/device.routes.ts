import { Router } from "express";

import { createPairingCode, getCurrentDevice, getStatus, pair } from "../controllers/device.controller.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import { requireDeviceToken } from "../middleware/device-auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createPairingCodeSchema, deviceIdParamSchema, pairDeviceSchema } from "../schemas/device.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const deviceRouter = Router();

deviceRouter.post(
  "/pairing-codes",
  requireAuth,
  requireRoles("ADMIN", "CAREGIVER"),
  validate(createPairingCodeSchema),
  asyncHandler(createPairingCode)
);

deviceRouter.post("/pair", validate(pairDeviceSchema), asyncHandler(pair));
deviceRouter.get("/me", requireDeviceToken, getCurrentDevice);
deviceRouter.get("/:id/status", requireAuth, validate(deviceIdParamSchema), asyncHandler(getStatus));

