import type { RequestHandler } from "express";

import { getUserById, verifyAccessToken } from "../services/auth.service.js";
import type { UserRole } from "../types/auth.js";
import { AppError } from "../utils/app-error.js";

const getBearerToken = (authorizationHeader: string | undefined) => {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Bearer token is required");
  }

  return authorizationHeader.slice("Bearer ".length);
};

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = getBearerToken(req.headers.authorization);
    const payload = verifyAccessToken(token);

    req.user = await getUserById(payload.sub);
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRoles =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      next(new AppError(401, "UNAUTHORIZED", "Authentication is required"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError(403, "FORBIDDEN", "You do not have permission to access this resource"));
      return;
    }

    next();
  };
