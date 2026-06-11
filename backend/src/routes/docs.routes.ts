import { Router } from "express";
import swaggerUi from "swagger-ui-express";

import { openApiDocument } from "../docs/openapi.js";

export const docsRouter = Router();

docsRouter.get("/openapi.json", (_req, res) => {
  res.status(200).json(openApiDocument);
});

docsRouter.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: "SafeMotion API Docs"
  })
);

