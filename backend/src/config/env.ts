import "dotenv/config";

const parsePort = (value: string | undefined) => {
  const port = Number(value ?? 3000);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer");
  }

  return port;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173"
};

