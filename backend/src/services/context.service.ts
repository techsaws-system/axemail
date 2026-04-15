import { Role } from "@prisma/client";

import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";

export async function resolveUserContext(input: { role?: string; userId?: string }) {
  if (input.userId) {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) {
      throw new AppError("User not found.", 404);
    }
    return user;
  }

  if (input.role) {
    const role = input.role.toUpperCase() as Role;
    const user = await prisma.user.findFirst({
      where: { role },
      orderBy: { createdAt: "asc" },
    });
    if (!user) {
      throw new AppError("User not found for role.", 404);
    }
    return user;
  }

  const fallback = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!fallback) {
    throw new AppError("No users available.", 404);
  }
  return fallback;
}
