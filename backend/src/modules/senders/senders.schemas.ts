import { z } from "zod";

const attachmentSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().nonnegative(),
  contentBase64: z.string().min(1),
});

export const gmailSenderSchema = z.object({
  fromName: z.string().min(1),
  to: z.string().min(1),
  replyTo: z.string().email(),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1),
  previewText: z.string().optional(),
  attachments: z.array(attachmentSchema).optional(),
  content: z.string().min(1),
});

export const domainSenderSchema = z.object({
  fromName: z.string().min(1),
  to: z.string().min(1),
  replyTo: z.string().email(),
  subject: z.string().min(1),
  previewText: z.string().optional(),
  attachments: z.array(attachmentSchema).optional(),
  content: z.string().min(1),
});

export const maskSenderSchema = z.object({
  fromName: z.string().min(1),
  fromEmail: z.string().email(),
  to: z.string().min(1),
  replyTo: z.string().email(),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1),
  previewText: z.string().optional(),
  attachments: z.array(attachmentSchema).optional(),
  content: z.string().min(1),
});
