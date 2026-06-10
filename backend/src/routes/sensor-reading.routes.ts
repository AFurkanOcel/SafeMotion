import { Router } from "express";

import { getSensorReadings, uploadSensorReading, uploadSensorReadingBatch } from "../controllers/sensor-reading.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireDeviceToken } from "../middleware/device-auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createSensorReadingBatchSchema,
  createSensorReadingSchema,
  listSensorReadingsSchema
} from "../schemas/sensor-reading.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const sensorReadingRouter = Router();

sensorReadingRouter.post("/", requireDeviceToken, validate(createSensorReadingSchema), asyncHandler(uploadSensorReading));
sensorReadingRouter.post(
  "/batch",
  requireDeviceToken,
  validate(createSensorReadingBatchSchema),
  asyncHandler(uploadSensorReadingBatch)
);
sensorReadingRouter.get(
  "/monitored-persons/:monitoredPersonId",
  requireAuth,
  validate(listSensorReadingsSchema),
  asyncHandler(getSensorReadings)
);

