import { apiRequest } from "./client";
import type { MonitoredPerson } from "../types";

export const getMonitoredPersons = (token: string) =>
  apiRequest<{ items: MonitoredPerson[] }>("/monitored-persons", { token });

export const createMonitoredPerson = (token: string, displayName: string, notes?: string) =>
  apiRequest<MonitoredPerson>("/monitored-persons", {
    method: "POST",
    token,
    body: JSON.stringify({
      displayName,
      notes: notes?.trim() || undefined
    })
  });
