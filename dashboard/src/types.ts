export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "CAREGIVER";
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type AlertStatus = "ACTIVE" | "RESOLVED";
export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AlertItem = {
  id: string;
  monitoredPersonId: string;
  detectionEventId: string | null;
  status: AlertStatus;
  severity: AlertSeverity;
  title: string;
  message: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedById: string | null;
  resolutionNote: string | null;
};

export type SensorReading = {
  id: string;
  deviceId: string;
  recordedAt: string;
  receivedAt: string;
  accelerometerX: number;
  accelerometerY: number;
  accelerometerZ: number;
  gyroscopeX: number;
  gyroscopeY: number;
  gyroscopeZ: number;
  accelerationMagnitude: number | null;
  rotationMagnitude: number | null;
};

export type LiveEvent = {
  id: string;
  name: string;
  receivedAt: string;
  payload: unknown;
};

