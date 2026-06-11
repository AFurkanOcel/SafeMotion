import { createServer } from "node:http";

import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { initializeSocketServer } from "./sockets/socket.server.js";

const app = createApp();
const httpServer = createServer(app);

initializeSocketServer(httpServer);

httpServer.listen(env.port, () => {
  logger.info(
    {
      port: env.port
    },
    "SafeMotion backend is running"
  );
});
