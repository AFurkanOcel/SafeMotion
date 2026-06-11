import { API_BASE_URL } from "../config";

export type HealthResponse = {
  status: string;
  service: string;
  timestamp: string;
};

export const getHealthStatus = async (): Promise<HealthResponse> => {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend health check failed");
  }

  return response.json() as Promise<HealthResponse>;
};
