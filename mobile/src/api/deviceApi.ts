import { Platform } from "react-native";

import { appConfig } from "../config/appConfig";
import type { DevicePlatform, PairDeviceResponse } from "../types/device";

const getPlatform = (): DevicePlatform => {
  if (Platform.OS === "ios") {
    return "IOS";
  }

  if (Platform.OS === "android") {
    return "ANDROID";
  }

  return "UNKNOWN";
};

export const pairDevice = async (pairingCode: string) => {
  const response = await fetch(`${appConfig.apiBaseUrl}/devices/pair`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      pairingCode,
      deviceName: `${Platform.OS} SafeMotion phone`,
      platform: getPlatform()
    })
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? `Pairing failed with status ${response.status}`);
  }

  return response.json() as Promise<PairDeviceResponse>;
};

