import { z } from "zod";

export const contentCheckSchema = z.object({
  fromName: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  previewText: z.string().trim().optional().default(""),
  message: z.string().trim().min(1),
});
