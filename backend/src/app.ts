import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware.js";
import { requestLoggerMiddleware } from "./middleware/request-logger.middleware.js";
import { alertRouter } from "./routes/alert.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { confirmationRouter } from "./routes/confirmation.routes.js";
import { databaseRouter } from "./routes/database.routes.js";
import { deviceRouter } from "./routes/device.routes.js";
import { docsRouter } from "./routes/docs.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { monitoredPersonRouter } from "./routes/monitored-person.routes.js";
import { sensorReadingRouter } from "./routes/sensor-reading.routes.js";

export const createApp = () => {
  const app = express();

  app.use(requestLoggerMiddleware);
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.use(docsRouter);
  app.use("/api/v1/alerts", alertRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/confirmation-responses", confirmationRouter);
  app.use("/api/v1/devices", deviceRouter);
  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/monitored-persons", monitoredPersonRouter);
  app.use("/api/v1/sensor-readings", sensorReadingRouter);
  app.use("/api/v1/database", databaseRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};
