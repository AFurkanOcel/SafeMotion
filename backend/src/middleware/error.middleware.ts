import type { ErrorRequestHandler, RequestHandler } from "express";

import { logger } from "../config/logger.js";
import { AppError } from "../utils/app-error.js";

export const notFoundMiddleware: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} was not found`
    }
  });
};

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  const httpError = error as { status?: number; statusCode?: number; type?: string } | null;

  if (httpError?.type === "entity.parse.failed") {
    logger.warn(
      {
        errorCode: "INVALID_JSON",
        statusCode: 400
      },
      "Request body must be valid JSON"
    );

    res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Request body must be valid JSON"
      }
    });
    return;
  }

  if (error instanceof AppError) {
    logger.warn(
      {
        errorCode: error.code,
        statusCode: error.statusCode
      },
      error.message
    );

    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Unexpected server error";
  logger.error(
    {
      error
    },
    message
  );

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message
    }
  });
};
