import { Router } from "express";

import {
  assignLimitsHandler,
  getOverviewHandler,
  getSenderAvailabilityHandler,
  getSenderCardsHandler,
  getUsageHandler,
} from "@/modules/usage/usage.controller";
import { requireAuthenticatedUser, requireRoles } from "@/middleware/auth";

export const usageRouter = Router();

usageRouter.get("/usage", requireAuthenticatedUser, getUsageHandler);
usageRouter.post("/limits/assign", requireAuthenticatedUser, requireRoles("ADMIN", "MANAGER"), assignLimitsHandler);
usageRouter.patch("/limits/:userId", requireAuthenticatedUser, requireRoles("ADMIN", "MANAGER"), assignLimitsHandler);
usageRouter.get("/sender-cards", requireAuthenticatedUser, getSenderCardsHandler);
usageRouter.get("/overview", requireAuthenticatedUser, getOverviewHandler);
usageRouter.get("/sender-availability/:senderType", requireAuthenticatedUser, getSenderAvailabilityHandler);
