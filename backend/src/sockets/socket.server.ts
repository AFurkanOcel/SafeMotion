import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

import { env } from "../config/env.js";
import { getDeviceByToken } from "../services/device.service.js";
import { getUserById, verifyAccessToken } from "../services/auth.service.js";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "./socket.types.js";

export type SafeMotionSocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

let io: SafeMotionSocketServer | null = null;

const readAuthToken = (auth: Record<string, unknown>) => {
  const token = auth.token;

  if (typeof token !== "string" || token.length === 0) {
    throw new Error("Socket authentication token is required");
  }

  return token;
};

export const initializeSocketServer = (httpServer: HttpServer) => {
  io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
      origin: env.corsOrigin,
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const auth = socket.handshake.auth as Record<string, unknown>;
      const clientType = auth.clientType;
      const token = readAuthToken(auth);

      if (clientType === "device") {
        const device = await getDeviceByToken(token);
        socket.data.client = { type: "device", device };
        socket.join(`device:${device.id}`);
        socket.join(`monitored-person:${device.monitoredPersonId}`);
        next();
        return;
      }

      const payload = verifyAccessToken(token);
      const user = await getUserById(payload.sub);
      socket.data.client = { type: "dashboard", user };
      socket.join("dashboard");
      socket.join(`user:${user.id}`);
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error("Socket authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const client = socket.data.client;

    if (client?.type === "dashboard") {
      socket.emit("device.status.updated", {
        status: "CONNECTED",
        clientType: "dashboard",
        userId: client.user.id
      });
    }

    if (client?.type === "device") {
      socket.emit("device.status.updated", {
        status: "CONNECTED",
        clientType: "device",
        deviceId: client.device.id,
        monitoredPersonId: client.device.monitoredPersonId
      });
    }
  });

  return io;
};

export const getSocketServer = () => io;

