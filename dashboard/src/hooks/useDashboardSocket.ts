import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import { SOCKET_URL } from "../config";
import type { LiveEvent } from "../types";

const MAX_EVENTS = 30;

export const useDashboardSocket = (token: string | null) => {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      setEvents([]);
      setIsConnected(false);
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: {
        token,
        clientType: "dashboard"
      }
    });

    const pushEvent = (name: string, payload: unknown) => {
      setEvents((current) => [
        {
          id: `${name}-${Date.now()}-${Math.random()}`,
          name,
          receivedAt: new Date().toISOString(),
          payload
        },
        ...current
      ].slice(0, MAX_EVENTS));
    };

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("connect_error", (error) => pushEvent("socket.connect_error", { message: error.message }));
    socket.on("sensor.reading.created", (payload) => pushEvent("sensor.reading.created", payload));
    socket.on("device.status.updated", (payload) => pushEvent("device.status.updated", payload));
    socket.on("detection.fallSuspected", (payload) => pushEvent("detection.fallSuspected", payload));
    socket.on("detection.inactivityDetected", (payload) => pushEvent("detection.inactivityDetected", payload));
    socket.on("detection.resolved", (payload) => pushEvent("detection.resolved", payload));
    socket.on("alert.created", (payload) => pushEvent("alert.created", payload));
    socket.on("alert.resolved", (payload) => pushEvent("alert.resolved", payload));

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return {
    events,
    isConnected
  };
};

