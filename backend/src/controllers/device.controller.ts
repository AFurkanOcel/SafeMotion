import type { Request, Response } from "express";

import { createDevicePairingCode, getDeviceStatus, pairDevice } from "../services/device.service.js";
import { AppError } from "../utils/app-error.js";

export const createPairingCode = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required");
  }

  const result = await createDevicePairingCode(req.user, req.body);

  res.status(201).json(result);
};

export const pair = async (req: Request, res: Response) => {
  const result = await pairDevice(req.body);

  res.status(200).json(result);
};

export const getStatus = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required");
  }

  const result = await getDeviceStatus(req.user, req.params.id);

  res.status(200).json(result);
};

export const getCurrentDevice = (req: Request, res: Response) => {
  res.status(200).json(req.device);
};

