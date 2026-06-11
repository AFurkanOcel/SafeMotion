import { apiRequest } from "./client";
import type { AlertItem } from "../types";

export const getAlerts = (token: string) => apiRequest<{ items: AlertItem[] }>("/alerts?limit=50", { token });

export const resolveAlert = (token: string, alertId: string, resolutionNote: string) =>
  apiRequest<AlertItem>(`/alerts/${alertId}/resolve`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ resolutionNote })
  });

