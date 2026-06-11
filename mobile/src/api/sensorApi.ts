import { appConfig } from "../config/appConfig";
import type { SensorReadingPayload, SensorReadingResponse } from "../types/sensorReading";

export const uploadSensorReading = async (deviceToken: string, payload: SensorReadingPayload) => {
  const response = await fetch(`${appConfig.apiBaseUrl}/sensor-readings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${deviceToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? `Sensor upload failed with status ${response.status}`);
  }

  return response.json() as Promise<SensorReadingResponse>;
};

