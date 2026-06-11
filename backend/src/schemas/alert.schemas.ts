import { z } from "zod";

export const alertIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

export const listAlertsSchema = z.object({
  query: z.object({
    status: z.enum(["ACTIVE", "RESOLVED"]).optional(),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    monitoredPersonId: z.string().uuid().optional(),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().int().min(1).max(200))
      .default("100")
  })
});

export const exportAlertsCsvSchema = z.object({
  query: z.object({
    status: z.enum(["ACTIVE", "RESOLVED"]).optional(),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    monitoredPersonId: z.string().uuid().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional()
  })
});

export const resolveAlertSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    resolutionNote: z.string().max(500).optional()
  })
});

export type AlertIdParamInput = z.infer<typeof alertIdParamSchema>;
export type ListAlertsInput = z.infer<typeof listAlertsSchema>;
export type ExportAlertsCsvInput = z.infer<typeof exportAlertsCsvSchema>;
export type ResolveAlertInput = z.infer<typeof resolveAlertSchema>;
