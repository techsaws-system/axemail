import {
  SenderAccountStatus,
  SenderHealthStatus,
  SenderType,
} from "@prisma/client";
import { z } from "zod";

export const senderAccountIdSchema = z.object({
  senderAccountId: z.string().min(1),
});

export const createSenderAccountSchema = z.object({
  type: z.nativeEnum(SenderType),
  label: z.string().min(1),
  email: z.email(),
  status: z.nativeEnum(SenderAccountStatus).default(SenderAccountStatus.ACTIVE),
  healthStatus: z.nativeEnum(SenderHealthStatus).optional(),
  password: z.string().min(1).optional(),
  appPassword: z.string().min(1).optional(),
});

export const updateSenderAccountSchema = z.object({
  label: z.string().min(1).optional(),
  email: z.email().optional(),
  status: z.nativeEnum(SenderAccountStatus).optional(),
  healthStatus: z.nativeEnum(SenderHealthStatus).optional(),
  password: z.string().min(1).optional(),
  appPassword: z.string().min(1).optional(),
});

export const senderPolicySchema = z.object({
  dailyLimit: z.coerce.number().int().positive(),
});
