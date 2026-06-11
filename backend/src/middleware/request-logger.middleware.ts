import type { Request, Response } from "express";
import { pinoHttp } from "pino-http";

import { logger } from "../config/logger.js";

export const requestLoggerMiddleware = pinoHttp({
  logger,
  customProps: (req: Request) => ({
    requestId: req.id
  }),
  customLogLevel: (_req: Request, res: Response, error?: Error) => {
    if (error || res.statusCode >= 500) {
      return "error";
    }

    if (res.statusCode >= 400) {
      return "warn";
    }

    return "info";
  }
});
