import type { Request, Response } from "express";

import type { AlertIdParamInput, ListAlertsInput, ResolveAlertInput } from "../schemas/alert.schemas.js";
import { getAlert, listAlerts, resolveAlert } from "../services/alert.service.js";
import { AppError } from "../utils/app-error.js";

export const getAlerts = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required");
  }

  const input = ({
    query: req.query
  } as unknown) as ListAlertsInput;

  const result = await listAlerts(req.user, input);

  res.status(200).json(result);
};

export const getAlertById = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required");
  }

  const input = ({
    params: req.params
  } as unknown) as AlertIdParamInput;

  const result = await getAlert(req.user, input);

  res.status(200).json(result);
};

export const resolveAlertById = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required");
  }

  const input = ({
    params: req.params,
    body: req.body
  } as unknown) as ResolveAlertInput;

  const result = await resolveAlert(req.user, input);

  res.status(200).json(result);
};

