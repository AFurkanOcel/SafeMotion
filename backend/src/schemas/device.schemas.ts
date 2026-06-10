import { z } from "zod";

const platformSchema = z.enum(["IOS", "ANDROID", "UNKNOWN"]).default("UNKNOWN");

export const createPairingCodeSchema = z.object({
  body: z.object({
    monitoredPersonId: z.string().uuid(),
    deviceName: z.string().min(2).max(120),
    platform: platformSchema
  })
});

export const pairDeviceSchema = z.object({
  body: z.object({
    pairingCode: z.string().regex(/^\d{6}$/),
    deviceName: z.string().min(2).max(120),
    platform: platformSchema
  })
});

export const deviceIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

export type CreatePairingCodeInput = z.infer<typeof createPairingCodeSchema>["body"];
export type PairDeviceInput = z.infer<typeof pairDeviceSchema>["body"];

