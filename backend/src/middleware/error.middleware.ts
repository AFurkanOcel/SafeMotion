import type { ErrorRequestHandler, RequestHandler } from "express";

export const notFoundMiddleware: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} was not found`
    }
  });
};

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  const message = error instanceof Error ? error.message : "Unexpected server error";

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message
    }
  });
};

