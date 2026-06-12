import { apiRequest } from "./client";
import type { LoginResponse, SignupResponse } from "../types";

export const login = (email: string, password: string) =>
  apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

export const signup = (fullName: string, email: string, password: string) =>
  apiRequest<SignupResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ fullName, email, password })
  });

export const changePassword = (token: string, currentPassword: string, newPassword: string) =>
  apiRequest<{ status: string }>("/auth/me/password", {
    method: "PATCH",
    token,
    body: JSON.stringify({ currentPassword, newPassword })
  });
