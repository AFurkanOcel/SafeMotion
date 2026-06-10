import { Router } from "express";

import { getDatabaseHealth } from "../controllers/database.controller.js";

export const databaseRouter = Router();

databaseRouter.get("/health", getDatabaseHealth);

