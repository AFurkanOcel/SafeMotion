import type { Request, Response } from "express";

import { prisma } from "../config/database.js";

export const getDatabaseHealth = async (_req: Request, res: Response) => {
  await prisma.$queryRaw`SELECT 1`;

  res.status(200).json({
    status: "ok",
    database: "connected",
    timestamp: new Date().toISOString()
  });
};

