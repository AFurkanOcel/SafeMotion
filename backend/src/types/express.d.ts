import type { AuthDevice, AuthUser } from "./auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      device?: AuthDevice;
    }
  }
}

export {};
