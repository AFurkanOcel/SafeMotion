import * as SecureStore from "expo-secure-store";

import type { StoredDeviceSession } from "../types/device";

const DEVICE_SESSION_KEY = "safemotion.deviceSession";

export const saveDeviceSession = async (session: StoredDeviceSession) => {
  await SecureStore.setItemAsync(DEVICE_SESSION_KEY, JSON.stringify(session));
};

export const loadDeviceSession = async () => {
  const value = await SecureStore.getItemAsync(DEVICE_SESSION_KEY);

  if (!value) {
    return null;
  }

  return JSON.parse(value) as StoredDeviceSession;
};

export const clearDeviceSession = async () => {
  await SecureStore.deleteItemAsync(DEVICE_SESSION_KEY);
};

