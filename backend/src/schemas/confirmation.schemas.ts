import { z } from "zod";

export const createConfirmationResponseSchema = z.object({
  body: z.object({
    detectionEventId: z.string().uuid(),
    response: z.enum(["SAFE", "NEEDS_HELP"])
  })
});

export type CreateConfirmationResponseInput = z.infer<typeof createConfirmationResponseSchema>["body"];

