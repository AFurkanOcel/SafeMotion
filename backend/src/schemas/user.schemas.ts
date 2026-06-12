import { z } from "zod";

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

export const resetUserPasswordSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    newPassword: z.string().min(8).max(128)
  })
});

export type UserIdParamInput = z.infer<typeof userIdParamSchema>;
export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>;
