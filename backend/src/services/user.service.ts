import { Role, UserStatus } from "@prisma/client";

import { prisma } from "@/config/prisma";
import type { ProfileDto, UserRecordDto } from "@/types/api.types";
import { AppError } from "@/utils/app-error";
import { mapRole, mapUserStatus } from "@/utils/enum-mappers";
import { hashPassword, verifyPassword } from "@/utils/password";

export async function listUsers(actorRole: Role): Promise<UserRecordDto[]> {
  const users = await prisma.user.findMany({
    where:
      actorRole === Role.ADMIN
        ? { role: { in: [Role.MANAGER, Role.EMPLOYEE] } }
        : actorRole === Role.MANAGER
          ? { role: Role.EMPLOYEE }
          : { id: "__not_allowed__" },
    orderBy: { createdAt: "asc" },
    include: {
      sessions: {
        where: {
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: { id: true },
      },
    },
  });
  return users.map((user) => mapUserRecord(user, user.sessions.length > 0));
}

export async function createUser(input: {
  firstName: string;
  lastName: string;
  pseudoName: string;
  email: string;
  role: Role;
  password?: string;
}) {
  const passwordHash = await hashPassword(input.password ?? "change-me-now");

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      pseudoName: input.pseudoName,
      email: input.email,
      role: input.role,
      status: UserStatus.ACTIVE,
      passwordHash,
    },
  });

  return mapUserRecord(user);
}

export async function updateUser(
  userId: string,
  input: Partial<{
    firstName: string;
    lastName: string;
    pseudoName: string;
    email: string;
    role: Role;
    password: string;
  }>,
) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw new AppError("User not found.", 404);
  }

  const passwordHash = input.password ? await hashPassword(input.password) : undefined;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      pseudoName: input.pseudoName,
      email: input.email,
      role: input.role,
      passwordHash,
    },
  });

  return mapUserRecord(user, (await countActiveSessions(user.id)) > 0);
}

export async function deleteUser(userId: string) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw new AppError("User not found.", 404);
  }

  await prisma.user.delete({ where: { id: userId } });
  return { deleted: true };
}

export async function getProfile(userId: string): Promise<ProfileDto> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    pseudoName: user.pseudoName,
    email: user.email,
  };
}

export async function updateProfile(
  userId: string,
  actorRole: Role,
  input: {
    firstName: string;
    lastName: string;
    pseudoName: string;
    email?: string;
  },
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      pseudoName: input.pseudoName,
      ...(actorRole === Role.ADMIN && input.email ? { email: input.email } : {}),
    },
  });

  return mapUserRecord(user, (await countActiveSessions(user.id)) > 0);
}

export async function changePassword(
  userId: string,
  sessionId: string | undefined,
  input: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  },
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const passwordMatches = await verifyPassword(input.oldPassword, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError("Current password is incorrect.", 400);
  }

  if (input.newPassword !== input.confirmPassword) {
    throw new AppError("New password and confirm password must match.", 400);
  }

  if (input.oldPassword === input.newPassword) {
    throw new AppError("New password must be different from the current password.", 400);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await hashPassword(input.newPassword),
      },
    }),
    prisma.userSession.updateMany({
      where: {
        userId,
        ...(sessionId ? { id: { not: sessionId } } : {}),
      },
      data: {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
      },
    }),
  ]);

  return { changed: true };
}

export async function terminateUserSessions(
  userId: string,
  actorUserId: string,
  actorRole: Role,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (user.id === actorUserId) {
    throw new AppError("You cannot terminate your own session from this action.", 400);
  }

  if (actorRole === Role.MANAGER && user.role !== Role.EMPLOYEE) {
    throw new AppError("Managers can only terminate employee sessions.", 403);
  }

  if (actorRole === Role.ADMIN && user.role === Role.ADMIN) {
    throw new AppError("Administrator sessions cannot be terminated from this action.", 403);
  }

  const result = await prisma.userSession.updateMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: {
      revokedAt: new Date(),
      lastUsedAt: new Date(),
    },
  });

  return {
    terminated: result.count > 0,
  };
}

async function countActiveSessions(userId: string) {
  return prisma.userSession.count({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
}

function mapUserRecord(user: {
  id: string;
  firstName: string;
  lastName: string;
  pseudoName: string;
  email: string;
  role: Role;
  status: UserStatus;
}, hasActiveSession = false): UserRecordDto {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    pseudoName: user.pseudoName,
    email: user.email,
    role: mapRole(user.role),
    status: hasActiveSession ? mapUserStatus(UserStatus.ACTIVE) : mapUserStatus(UserStatus.NOT_ACTIVE),
  };
}
