const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";
const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL ?? "http://localhost:3000";

export const appConfig = {
  apiBaseUrl,
  socketUrl,
  usesLocalhost: apiBaseUrl.includes("localhost") || apiBaseUrl.includes("127.0.0.1")
};
