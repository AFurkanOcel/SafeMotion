import type { AuthDevice, AuthUser } from "../types/auth.js";

export type SocketClient =
  | {
      type: "dashboard";
      user: AuthUser;
    }
  | {
      type: "device";
      device: AuthDevice;
    };

export type ServerToClientEvents = {
  "sensor.reading.created": (payload: unknown) => void;
  "device.status.updated": (payload: unknown) => void;
  "detection.fallSuspected": (payload: unknown) => void;
  "detection.inactivityDetected": (payload: unknown) => void;
  "detection.resolved": (payload: unknown) => void;
  "confirmation.requested": (payload: unknown) => void;
  "confirmation.closed": (payload: unknown) => void;
  "alert.created": (payload: unknown) => void;
  "alert.resolved": (payload: unknown) => void;
};

export type ClientToServerEvents = Record<string, never>;
export type InterServerEvents = Record<string, never>;

export type SocketData = {
  client?: SocketClient;
};

