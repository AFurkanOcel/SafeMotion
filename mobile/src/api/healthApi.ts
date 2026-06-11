import { appConfig } from "../config/appConfig";

export const getBackendHealth = async () => {
  const response = await fetch(`${appConfig.apiBaseUrl}/health`);

  if (!response.ok) {
    throw new Error(`Backend health check failed with status ${response.status}`);
  }

  return response.json() as Promise<{
    status: string;
    service: string;
    timestamp: string;
  }>;
};
