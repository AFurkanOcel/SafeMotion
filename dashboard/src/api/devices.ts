import { apiRequest } from "./client";
import type { DevicePlatform, PairingCodeResponse } from "../types";

export const createPairingCode = (
  token: string,
  monitoredPersonId: string,
  deviceName: string,
  platform: DevicePlatform
) =>
  apiRequest<PairingCodeResponse>("/devices/pairing-codes", {
    method: "POST",
    token,
    body: JSON.stringify({
      monitoredPersonId,
      deviceName,
      platform
    })
  });
