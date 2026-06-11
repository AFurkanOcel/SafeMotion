export type DevicePlatform = "IOS" | "ANDROID" | "UNKNOWN";

export type PairDeviceResponse = {
  deviceId: string;
  monitoredPersonId: string;
  deviceToken: string;
};

export type StoredDeviceSession = {
  deviceId: string;
  monitoredPersonId: string;
  deviceToken: string;
  pairedAt: string;
};

