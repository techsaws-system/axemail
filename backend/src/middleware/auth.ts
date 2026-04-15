import type { NextFunction, Request, Response } from "express";

import { prisma } from "@/config/prisma";
import { ROLE } from "@/constants/enums";
import { readAccessToken } from "@/services/auth.service";
import { AppError } from "@/utils/app-error";

export function attachAuth(request: Request, _response: Response, next: NextFunction) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    next();
    return;
  }

  request.auth = readAccessToken(token);
  next();
}

export function requireAuthenticatedUser(request: Request, _response: Response, next: NextFunction) {
  void ensureAuthenticatedSession(request)
    .then(() => next())
    .catch((error) => next(error));
}

export function requireRoles(...roles: Array<(typeof ROLE)[keyof typeof ROLE]>) {
  return (request: Request, _response: Response, next: NextFunction) => {
    void ensureAuthenticatedSession(request)
      .then(() => {
        if (!roles.includes(request.auth!.role)) {
          throw new AppError("Insufficient permissions.", 403);
        }

        next();
      })
      .catch((error) => next(error));
  };
}

async function ensureAuthenticatedSession(request: Request) {
  if (!request.auth?.sessionId) {
    throw new AppError("Authentication required.", 401);
  }

  const session = await prisma.userSession.findUnique({
    where: { id: request.auth.sessionId },
    include: { user: true },
  });

  if (!session) {
    throw new AppError("Session is not active.", 401);
  }

  if (session.revokedAt) {
    throw new AppError("Session has been terminated.", 401);
  }

  if (session.expiresAt <= new Date()) {
    throw new AppError("Session expired.", 401);
  }

  if (!session.user) {
    throw new AppError("User account is not available.", 403);
  }
}
