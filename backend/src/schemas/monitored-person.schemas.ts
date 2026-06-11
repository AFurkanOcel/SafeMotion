import { z } from "zod";

export const createMonitoredPersonSchema = z.object({
  body: z.object({
    displayName: z.string().min(2).max(120),
    notes: z.string().max(500).optional(),
    caregiverId: z.string().uuid().optional()
  })
});

export const monitoredPersonIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

export type CreateMonitoredPersonInput = z.infer<typeof createMonitoredPersonSchema>["body"];
export type MonitoredPersonIdParamInput = z.infer<typeof monitoredPersonIdParamSchema>;
