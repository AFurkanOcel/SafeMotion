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
