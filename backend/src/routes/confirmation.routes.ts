import { Router } from "express";

import { getActiveConfirmation, submitConfirmationResponse } from "../controllers/confirmation.controller.js";
import { requireDeviceToken } from "../middleware/device-auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createConfirmationResponseSchema } from "../schemas/confirmation.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const confirmationRouter = Router();

confirmationRouter.get("/active", requireDeviceToken, asyncHandler(getActiveConfirmation));
confirmationRouter.post(
  "/",
  requireDeviceToken,
  validate(createConfirmationResponseSchema),
  asyncHandler(submitConfirmationResponse)
);

