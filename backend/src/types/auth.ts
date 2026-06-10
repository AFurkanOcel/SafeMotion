export type UserRole = "ADMIN" | "CAREGIVER";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
};

export type JwtPayload = {
  sub: string;
  role: UserRole;
};

export type AuthDevice = {
  id: string;
  monitoredPersonId: string;
  deviceName: string;
  platform: "IOS" | "ANDROID" | "UNKNOWN";
};
