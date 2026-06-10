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
