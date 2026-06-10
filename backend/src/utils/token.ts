import { createHash, randomBytes, randomInt } from "node:crypto";

import { env } from "../config/env.js";

export const createPairingCode = () => randomInt(100000, 1000000).toString();

export const createDeviceToken = () => randomBytes(32).toString("hex");

export const hashDeviceSecret = (value: string) =>
  createHash("sha256").update(`${env.deviceTokenSecret}:${value}`).digest("hex");

