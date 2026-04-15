import type { Request, Response } from "express";
import { Role } from "@prisma/client";

import { getOverview } from "@/services/analytics.service";
import { assignUserLimits, buildUserUsage, getSenderAvailability, getUsageByRole } from "@/services/quota.service";
import { asyncHandler } from "@/utils/async-handler";
import { assignLimitsSchema } from "@/modules/usage/usage.schemas";

export const getUsageHandler = asyncHandler(async (request: Request, response: Response) => {
  if (request.auth!.role === Role.EMPLOYEE) {
    response.json({ data: [await buildUserUsage(request.auth!.userId)] });
    return;
  }

  response.json({ data: await getUsageByRole(request.auth!.role) });
});

export const assignLimitsHandler = asyncHandler(async (request: Request, response: Response) => {
  const payload = assignLimitsSchema.parse({
    ...request.body,
    userId: request.params.userId ?? request.body.userId,
  });
  response.json({
    data: await assignUserLimits({
      ...payload,
      actorUserId: request.auth!.userId,
      actorRole: request.auth!.role,
    }),
  });
});

export const getSenderCardsHandler = asyncHandler(async (request: Request, response: Response) => {
  response.json({ data: (await buildUserUsage(request.auth!.userId)).senderQuotas });
});

export const getOverviewHandler = asyncHandler(async (request: Request, response: Response) => {
  response.json({
    data: await getOverview({
      role: request.auth!.role as Role,
      userId: request.auth!.userId,
    }),
  });
});

export const getSenderAvailabilityHandler = asyncHandler(async (request: Request, response: Response) => {
  const senderType = String(request.params.senderType).toUpperCase() as "GMAIL" | "DOMAIN" | "MASK";
  response.json({ data: await getSenderAvailability({ senderType, userId: request.auth!.userId }) });
});
