import type { Request, Response } from "express";

import type { ListSensorReadingsInput } from "../schemas/sensor-reading.schemas.js";
import { createSensorReading, createSensorReadingBatch, listSensorReadings } from "../services/sensor-reading.service.js";
import { AppError } from "../utils/app-error.js";

export const uploadSensorReading = async (req: Request, res: Response) => {
  if (!req.device) {
    throw new AppError(401, "INVALID_DEVICE_TOKEN", "Device token is required");
  }

  const result = await createSensorReading(req.device, req.body);

  res.status(201).json(result);
};

export const uploadSensorReadingBatch = async (req: Request, res: Response) => {
  if (!req.device) {
    throw new AppError(401, "INVALID_DEVICE_TOKEN", "Device token is required");
  }

  const result = await createSensorReadingBatch(req.device, req.body);

  res.status(201).json(result);
};

export const getSensorReadings = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required");
  }

  const input = ({
    params: req.params,
    query: req.query
  } as unknown) as ListSensorReadingsInput;

  const result = await listSensorReadings(req.user, input);

  res.status(200).json(result);
};
