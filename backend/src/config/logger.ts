import pino from "pino";

import { env } from "./env.js";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (env.nodeEnv === "production" ? "info" : "debug"),
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "passwordHash",
      "deviceToken",
      "*.deviceToken",
      "*.password"
    ],
    censor: "[REDACTED]"
  },
  base: {
    service: "safemotion-backend"
  }
});

