import { apiRequest } from "./client";
import type { ManagedUser } from "../types";

export const getUsers = (token: string) => apiRequest<{ items: ManagedUser[] }>("/users", { token });

export const deactivateUser = (token: string, userId: string) =>
  apiRequest<ManagedUser>(`/users/${userId}/deactivate`, {
    method: "PATCH",
    token
  });

export const resetUserPassword = (token: string, userId: string, newPassword: string) =>
  apiRequest<{ status: string }>(`/users/${userId}/password`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ newPassword })
  });
