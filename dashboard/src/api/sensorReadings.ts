import { apiRequest } from "./client";
import type { SensorReading } from "../types";

export const getSensorReadings = (token: string, monitoredPersonId: string) =>
  apiRequest<{ items: SensorReading[] }>(`/sensor-readings/monitored-persons/${monitoredPersonId}?limit=50`, { token });

