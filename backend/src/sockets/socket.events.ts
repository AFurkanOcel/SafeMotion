import { getSocketServer } from "./socket.server.js";
import type { ServerToClientEvents } from "./socket.types.js";

const emitToRoom = (room: string, name: keyof ServerToClientEvents, payload: unknown) => {
  getSocketServer()?.to(room).emit(name, payload);
};

export const socketEvents = {
  sensorReadingCreated(payload: unknown) {
    emitToRoom("dashboard", "sensor.reading.created", payload);
  },

  deviceStatusUpdated(payload: { deviceId: string; monitoredPersonId?: string; status: string; lastSeenAt?: Date }) {
    emitToRoom("dashboard", "device.status.updated", payload);

    if (payload.monitoredPersonId) {
      emitToRoom(`monitored-person:${payload.monitoredPersonId}`, "device.status.updated", payload);
    }
  },

  fallSuspected(payload: { detectionEventId: string; deviceId: string; monitoredPersonId: string }) {
    emitToRoom("dashboard", "detection.fallSuspected", payload);
    emitToRoom(`device:${payload.deviceId}`, "confirmation.requested", {
      detectionEventId: payload.detectionEventId,
      message: "Are you okay?",
      actions: ["I'm safe", "Need help"]
    });
  },

  inactivityDetected(payload: unknown) {
    emitToRoom("dashboard", "detection.inactivityDetected", payload);
  },

  detectionResolved(payload: { detectionEventId: string; deviceId?: string; status: string }) {
    emitToRoom("dashboard", "detection.resolved", payload);

    if (payload.deviceId) {
      emitToRoom(`device:${payload.deviceId}`, "confirmation.closed", payload);
    }
  },

  alertCreated(payload: unknown) {
    emitToRoom("dashboard", "alert.created", payload);
  },

  alertResolved(payload: unknown) {
    emitToRoom("dashboard", "alert.resolved", payload);
  }
};
