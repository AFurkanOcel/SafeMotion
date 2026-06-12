import type { Request, Response } from "express";

import { deactivateUser, listUsers, reactivateUser, removeUser, resetUserPassword } from "../services/user.service.js";
import { AppError } from "../utils/app-error.js";

export const list = async (_req: Request, res: Response) => {
  const result = await listUsers();

  res.status(200).json(result);
};

export const deactivate = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required");
  }

  const result = await deactivateUser(req.user, {
    params: {
      id: req.params.id
    }
  });

  res.status(200).json(result);
};

export const reactivate = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required");
  }

  const result = await reactivateUser(req.user, {
    params: {
      id: req.params.id
    }
  });

  res.status(200).json(result);
};

export const remove = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required");
  }

  const result = await removeUser(req.user, {
    params: {
      id: req.params.id
    }
  });

  res.status(200).json(result);
};

export const resetPassword = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required");
  }

  const result = await resetUserPassword(req.user, {
    params: {
      id: req.params.id
    },
    body: req.body
  });

  res.status(200).json(result);
};
