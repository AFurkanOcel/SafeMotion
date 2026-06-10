import type { RequestHandler } from "express";

import { getDeviceByToken } from "../services/device.service.js";
import { AppError } from "../utils/app-error.js";

const getBearerToken = (authorizationHeader: string | undefined) => {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AppError(401, "INVALID_DEVICE_TOKEN", "Device bearer token is required");
  }

  return authorizationHeader.slice("Bearer ".length);
};

export const requireDeviceToken: RequestHandler = async (req, _res, next) => {
  try {
    const token = getBearerToken(req.headers.authorization);
    req.device = await getDeviceByToken(token);
    next();
  } catch (error) {
    next(error);
  }
};

