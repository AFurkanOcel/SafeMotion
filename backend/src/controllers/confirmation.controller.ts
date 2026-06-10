import type { Request, Response } from "express";

import { createConfirmationResponse, getActiveConfirmationRequest } from "../services/confirmation.service.js";
import { AppError } from "../utils/app-error.js";

export const submitConfirmationResponse = async (req: Request, res: Response) => {
  if (!req.device) {
    throw new AppError(401, "INVALID_DEVICE_TOKEN", "Device token is required");
  }

  const result = await createConfirmationResponse(req.device, req.body);

  res.status(201).json(result);
};

export const getActiveConfirmation = async (req: Request, res: Response) => {
  if (!req.device) {
    throw new AppError(401, "INVALID_DEVICE_TOKEN", "Device token is required");
  }

  const result = await getActiveConfirmationRequest(req.device);

  res.status(200).json(result);
};

