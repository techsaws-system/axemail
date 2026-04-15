import { Router } from "express";

import {
  createSenderAccountHandler,
  deleteSenderAccountHandler,
  getMaskServerHealthHandler,
  getSenderAccountMetricsHandler,
  getSenderAccountsHandler,
  getSenderPoliciesHandler,
  testSenderAccountHandler,
  updateSenderPolicyHandler,
  updateSenderAccountHandler,
} from "@/modules/sender-accounts/sender-accounts.controller";
import { requireAuthenticatedUser, requireRoles } from "@/middleware/auth";

export const senderAccountsRouter = Router();

senderAccountsRouter.get("/sender-account-metrics", requireAuthenticatedUser, requireRoles("ADMIN"), getSenderAccountMetricsHandler);
senderAccountsRouter.get("/sender-accounts", requireAuthenticatedUser, requireRoles("ADMIN"), getSenderAccountsHandler);
senderAccountsRouter.get("/sender-policies", requireAuthenticatedUser, requireRoles("ADMIN"), getSenderPoliciesHandler);
senderAccountsRouter.post("/sender-accounts", requireAuthenticatedUser, requireRoles("ADMIN"), createSenderAccountHandler);
senderAccountsRouter.patch("/sender-accounts/:senderAccountId", requireAuthenticatedUser, requireRoles("ADMIN"), updateSenderAccountHandler);
senderAccountsRouter.delete("/sender-accounts/:senderAccountId", requireAuthenticatedUser, requireRoles("ADMIN"), deleteSenderAccountHandler);
senderAccountsRouter.post("/sender-accounts/:senderAccountId/test", requireAuthenticatedUser, requireRoles("ADMIN"), testSenderAccountHandler);
senderAccountsRouter.put("/sender-policies/:senderType", requireAuthenticatedUser, requireRoles("ADMIN"), updateSenderPolicyHandler);
senderAccountsRouter.get("/mask-server/health", requireAuthenticatedUser, requireRoles("ADMIN"), getMaskServerHealthHandler);
