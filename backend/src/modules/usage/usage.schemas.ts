import { z } from "zod";

export const assignLimitsSchema = z.object({
  userId: z.string().min(1),
  gmail: z.coerce.number().int().min(0),
  domain: z.coerce.number().int().min(0),
  mask: z.coerce.number().int().min(0),
});
