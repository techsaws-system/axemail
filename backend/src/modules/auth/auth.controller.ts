import type { Request, Response } from "express";

import { login, refreshSession, revokeSession } from "@/services/auth.service";
import { asyncHandler } from "@/utils/async-handler";
import { loginSchema, logoutSchema, refreshSchema } from "@/modules/auth/auth.schemas";

export const loginHandler = asyncHandler(async (request: Request, response: Response) => {
  const payload = loginSchema.parse(request.body);
  response.status(200).json({
    data: await login({
      ...payload,
      ipAddress: request.ip,
      userAgent: request.get("user-agent"),
    }),
  });
});

export const refreshHandler = asyncHandler(async (request: Request, response: Response) => {
  const payload = refreshSchema.parse(request.body);
  response.status(200).json({
    data: await refreshSession({
      ...payload,
      ipAddress: request.ip,
      userAgent: request.get("user-agent"),
    }),
  });
});

export const logoutHandler = asyncHandler(async (request: Request, response: Response) => {
  const payload = logoutSchema.parse(request.body);
  response.status(200).json({ data: await revokeSession(payload) });
});
