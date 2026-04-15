import crypto from "node:crypto";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { UserStatus } from "@prisma/client";

import { env } from "@/config/env";
import { ROLE } from "@/constants/enums";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";
import { hashOpaqueToken, hashPassword, needsPasswordRehash, verifyPassword } from "@/utils/password";
import { mapRole, mapUserStatus } from "@/utils/enum-mappers";

type AuthTokenPayload = {
  sub: string;
  role: (typeof ROLE)[keyof typeof ROLE];
  email: string;
  type: "access" | "refresh";
  sid: string;
};

const jwtSecret: Secret = env.JWT_SECRET;
const accessTokenExpiresIn = env.JWT_EXPIRES_IN as SignOptions["expiresIn"];
const refreshTokenExpiresIn = env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"];

export async function login(input: {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  scheduleSessionCleanup();

  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (needsPasswordRehash(user.passwordHash)) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(input.password),
      },
    });
  }

  const session = await buildAuthSession({
    userId: user.id,
    role: user.role,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    pseudoName: user.pseudoName,
    status: user.status,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return session.response;
}

export async function refreshSession(input: {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  scheduleSessionCleanup();

  const payload = verifyToken(input.refreshToken, "refresh");

  const session = await prisma.userSession.findUnique({
    where: { id: payload.sid },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    throw new AppError("Refresh session is not active.", 401);
  }

  if (session.refreshTokenHash !== hashOpaqueToken(input.refreshToken)) {
    throw new AppError("Refresh token is invalid.", 401);
  }

  if (!session.user) {
    throw new AppError("User account is not available.", 403);
  }

  const nextSession = await buildAuthSession({
    userId: session.user.id,
    role: session.user.role,
    email: session.user.email,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    pseudoName: session.user.pseudoName,
    status: session.user.status,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  await prisma.userSession.update({
    where: { id: session.id },
    data: {
      revokedAt: new Date(),
      replacedById: nextSession.sessionId,
      lastUsedAt: new Date(),
    },
  });

  return nextSession.response;
}

export async function revokeSession(input: { refreshToken: string }) {
  scheduleSessionCleanup();

  const payload = verifyToken(input.refreshToken, "refresh");

  const session = await prisma.userSession.findUnique({
    where: { id: payload.sid },
  });

  if (!session) {
    return { revoked: true };
  }

  if (session.refreshTokenHash !== hashOpaqueToken(input.refreshToken)) {
    throw new AppError("Refresh token is invalid.", 401);
  }

  await prisma.userSession.update({
    where: { id: session.id },
    data: {
      revokedAt: new Date(),
      lastUsedAt: new Date(),
    },
  });

  return { revoked: true };
}

export function readAccessToken(token: string) {
  const payload = verifyToken(token, "access");

  return {
    userId: payload.sub,
    role: payload.role,
    email: payload.email,
    sessionId: payload.sid,
  };
}

async function buildAuthSession(input: {
  userId: string;
  role: (typeof ROLE)[keyof typeof ROLE];
  email: string;
  firstName: string;
  lastName: string;
  pseudoName: string;
  status: UserStatus;
  ipAddress?: string;
  userAgent?: string;
}) {
  const sessionId = crypto.randomUUID();

  const accessToken = jwt.sign(
    {
      sub: input.userId,
      role: input.role,
      email: input.email,
      type: "access",
      sid: sessionId,
    } satisfies AuthTokenPayload,
    jwtSecret,
    { expiresIn: accessTokenExpiresIn },
  );

  const refreshToken = jwt.sign(
    {
      sub: input.userId,
      role: input.role,
      email: input.email,
      type: "refresh",
      sid: sessionId,
    } satisfies AuthTokenPayload,
    jwtSecret,
    { expiresIn: refreshTokenExpiresIn },
  );

  await prisma.userSession.create({
    data: {
      id: sessionId,
      userId: input.userId,
      refreshTokenHash: hashOpaqueToken(refreshToken),
      expiresAt: addDuration(refreshTokenExpiresIn),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      lastUsedAt: new Date(),
    },
  });

  return {
    sessionId,
    response: {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_EXPIRES_IN,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
      user: {
        id: input.userId,
        firstName: input.firstName,
        lastName: input.lastName,
        pseudoName: input.pseudoName,
        email: input.email,
        role: mapRole(input.role),
        status: mapUserStatus(UserStatus.ACTIVE),
      },
    },
  };
}

function verifyToken(token: string, expectedType: "access" | "refresh") {
  try {
    const payload = jwt.verify(token, jwtSecret) as AuthTokenPayload;

    if (payload.type !== expectedType) {
      throw new AppError("Invalid token type.", 401);
    }

    if (!payload.sid) {
      throw new AppError("Invalid session token.", 401);
    }

    return payload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Invalid or expired token.", 401);
  }
}

function addDuration(duration: SignOptions["expiresIn"]) {
  if (typeof duration === "number") {
    return new Date(Date.now() + duration * 1000);
  }

  const match = String(duration).trim().match(/^(\d+)([smhd])$/i);

  if (!match) {
    throw new Error("Unsupported token duration format.");
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multiplier =
    unit === "s"
      ? 1000
      : unit === "m"
        ? 60_000
        : unit === "h"
          ? 3_600_000
          : 86_400_000;

  return new Date(Date.now() + value * multiplier);
}

function scheduleSessionCleanup() {
  void cleanupStaleSessions().catch((error) => {
    console.error("Session cleanup failed.", error);
  });
}

async function cleanupStaleSessions() {
  const staleBefore = new Date(
    Date.now() - env.SESSION_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );

  await prisma.userSession.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: staleBefore } },
        { revokedAt: { not: null, lt: staleBefore } },
      ],
    },
  });
}
