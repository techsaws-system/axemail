import type { Request, Response } from "express";

import {
  createSenderAccount,
  deleteSenderAccount,
  getSenderAccountMetrics,
  listSenderAccounts,
  testSenderAccount,
  updateSenderAccount,
} from "@/services/sender-account.service";
import { getMaskServerHealth } from "@/services/mask-server.service";
import { listSenderPolicies, updateSenderPolicy } from "@/services/sender-policy.service";
import { asyncHandler } from "@/utils/async-handler";
import {
  createSenderAccountSchema,
  senderPolicySchema,
  senderAccountIdSchema,
  updateSenderAccountSchema,
} from "@/modules/sender-accounts/sender-accounts.schemas";

export const getSenderAccountsHandler = asyncHandler(async (_request: Request, response: Response) => {
  response.json({ data: await listSenderAccounts() });
});

export const getSenderAccountMetricsHandler = asyncHandler(async (_request: Request, response: Response) => {
  response.json({ data: await getSenderAccountMetrics() });
});

export const getSenderPoliciesHandler = asyncHandler(async (_request: Request, response: Response) => {
  response.json({ data: await listSenderPolicies() });
});

export const createSenderAccountHandler = asyncHandler(async (request: Request, response: Response) => {
  const payload = createSenderAccountSchema.parse(request.body);
  response.status(201).json({ data: await createSenderAccount(payload) });
});

export const updateSenderAccountHandler = asyncHandler(async (request: Request, response: Response) => {
  const { senderAccountId } = senderAccountIdSchema.parse(request.params);
  const payload = updateSenderAccountSchema.parse(request.body);
  response.json({ data: await updateSenderAccount(senderAccountId, payload) });
});

export const deleteSenderAccountHandler = asyncHandler(async (request: Request, response: Response) => {
  const { senderAccountId } = senderAccountIdSchema.parse(request.params);
  response.json({ data: await deleteSenderAccount(senderAccountId) });
});

export const updateSenderPolicyHandler = asyncHandler(async (request: Request, response: Response) => {
  const senderType = String(request.params.senderType).toUpperCase() as "GMAIL" | "DOMAIN" | "MASK";
  const payload = senderPolicySchema.parse(request.body);
  response.json({ data: await updateSenderPolicy(senderType, payload.dailyLimit) });
});

export const testSenderAccountHandler = asyncHandler(async (request: Request, response: Response) => {
  const { senderAccountId } = senderAccountIdSchema.parse(request.params);
  response.json({ data: await testSenderAccount(senderAccountId) });
});

export const getMaskServerHealthHandler = asyncHandler(async (_request: Request, response: Response) => {
  response.json({ data: await getMaskServerHealth() });
});
