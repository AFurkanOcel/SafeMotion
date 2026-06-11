import { apiRequest } from "./client";
import type { LoginResponse } from "../types";

export const login = (email: string, password: string) =>
  apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

