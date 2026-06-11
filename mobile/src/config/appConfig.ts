export const appConfig = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1",
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL ?? "http://localhost:3000"
};
