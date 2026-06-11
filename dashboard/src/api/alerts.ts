import { apiRequest } from "./client";
import { API_BASE_URL } from "../config";
import type { AlertItem } from "../types";

export const getAlerts = (token: string) => apiRequest<{ items: AlertItem[] }>("/alerts?limit=50", { token });

export const resolveAlert = (token: string, alertId: string, resolutionNote: string) =>
  apiRequest<AlertItem>(`/alerts/${alertId}/resolve`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ resolutionNote })
  });

export const exportAlertsCsv = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/alerts/export.csv`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`CSV export failed with status ${response.status}`);
  }

  return response.blob();
};
