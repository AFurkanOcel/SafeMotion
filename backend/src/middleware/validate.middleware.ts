import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";
import { ZodError } from "zod";

import { AppError } from "../utils/app-error.js";

export const validate =
  (schema: ZodSchema): RequestHandler =>
  (req, _res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query
      });

      req.body = parsed.body;
      req.params = parsed.params ?? req.params;
      req.query = parsed.query ?? req.query;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError(400, "VALIDATION_ERROR", error.issues[0]?.message ?? "Invalid request"));
        return;
      }

      next(error);
    }
  };

