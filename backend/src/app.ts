import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { databaseRouter } from "./routes/database.routes.js";
import { deviceRouter } from "./routes/device.routes.js";
import { healthRouter } from "./routes/health.routes.js";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/devices", deviceRouter);
  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/database", databaseRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};
