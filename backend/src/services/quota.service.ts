import { DeliveryStatus, Role, SenderType } from "@prisma/client";

import { prisma } from "@/config/prisma";
import type { SenderQuotaDto, UserUsageDto } from "@/types/api.types";
import { AppError } from "@/utils/app-error";
import { startOfTodayUtc } from "@/utils/date";
import { mapSenderType } from "@/utils/enum-mappers";

const senderOrder = [SenderType.GMAIL, SenderType.DOMAIN, SenderType.MASK];
const countedDeliveryStatuses = [DeliveryStatus.QUEUED, DeliveryStatus.SENT] as const;

export async function getSenderTypeDailyLimitMap() {
  const [grouped, policies] = await Promise.all([
    prisma.senderAccount.groupBy({
      by: ["type"],
      where: { status: "ACTIVE" },
      _sum: { dailyLimit: true },
    }),
    prisma.senderPolicy.findMany(),
  ]);

  const capacityMap = grouped.reduce<Record<SenderType, number>>(
    (accumulator, item) => {
      accumulator[item.type] = item._sum.dailyLimit ?? 0;
      return accumulator;
    },
    {
      [SenderType.GMAIL]: 0,
      [SenderType.DOMAIN]: 0,
      [SenderType.MASK]: 0,
    },
  );

  const maskPolicy = policies.find((item) => item.senderType === SenderType.MASK);
  capacityMap[SenderType.MASK] = maskPolicy?.dailyLimit ?? 2000;

  return capacityMap;
}

async function getSenderTypeActiveCountMap() {
  const grouped = await prisma.senderAccount.groupBy({
    by: ["type"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
  });

  return grouped.reduce<Record<SenderType, number>>(
    (accumulator, item) => {
      accumulator[item.type] = item._count._all ?? 0;
      return accumulator;
    },
    {
      [SenderType.GMAIL]: 0,
      [SenderType.DOMAIN]: 0,
      [SenderType.MASK]: 1,
    },
  );
}

export async function getUsageByRole(role: Role): Promise<UserUsageDto[]> {
  const users = await prisma.user.findMany({
    where:
      role === Role.ADMIN
        ? undefined
        : role === Role.MANAGER
          ? undefined
          : { role: Role.EMPLOYEE },
    include: {
      allocations: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const visibleUsers =
    role === Role.EMPLOYEE ? users.slice(0, 1) : users;

  return Promise.all(visibleUsers.map((user) => buildUserUsage(user.id)));
}

export async function buildUserUsage(userId: string): Promise<UserUsageDto> {
  const [allocationRows, usageRows, totalLimitMap] = await Promise.all([
    prisma.userSenderAllocation.findMany({
      where: { userId },
      orderBy: { senderType: "asc" },
    }),
    prisma.deliveryRecord.groupBy({
      by: ["senderType"],
      _count: { _all: true },
      where: {
        userId,
        createdAt: { gte: startOfTodayUtc() },
        status: { in: countedDeliveryStatuses as unknown as DeliveryStatus[] },
      },
    }),
    getSenderTypeDailyLimitMap(),
  ]);

  const usageByType = usageRows.reduce<Record<SenderType, number>>(
    (accumulator, row) => {
      accumulator[row.senderType] += row._count._all;
      return accumulator;
    },
    {
      [SenderType.GMAIL]: 0,
      [SenderType.DOMAIN]: 0,
      [SenderType.MASK]: 0,
    },
  );

  const quotaMap = new Map(allocationRows.map((row) => [row.senderType, row]));

  const senderQuotas: SenderQuotaDto[] = senderOrder.map((senderType) => {
    const allocation = quotaMap.get(senderType);
    const assignedLimit = allocation?.assignedLimit ?? 0;
    const used = usageByType[senderType] ?? 0;
    const totalLimit = totalLimitMap[senderType] ?? 0;

    return {
      id: allocation?.id ?? `${userId}-${senderType.toLowerCase()}`,
      type: mapSenderType(senderType),
      label: buildQuotaLabel(senderType, userId),
      totalLimit,
      assignedLimit,
      used,
      remaining: Math.max(assignedLimit - used, 0),
    };
  });

  return {
    userId,
    senderQuotas,
  };
}

export async function assignUserLimits(input: {
  userId: string;
  gmail: number;
  domain: number;
  mask: number;
  actorUserId: string;
  actorRole: Role;
}) {
  const targetUser = await prisma.user.findUnique({
    where: { id: input.userId },
  });

  if (!targetUser) {
    throw new AppError("Target user not found.", 404);
  }

  if (input.actorRole === Role.MANAGER && targetUser.role !== Role.EMPLOYEE) {
    throw new AppError("Managers can only assign limits to employees.", 403);
  }

  const currentAllocations = await prisma.userSenderAllocation.findMany({
    where: { userId: input.userId },
  });

  const currentAllocationMap = new Map(
    currentAllocations.map((row) => [row.senderType, row.assignedLimit]),
  );

  const [capacityMap, assignedByType] = await Promise.all([
    getSenderTypeDailyLimitMap(),
    prisma.userSenderAllocation.groupBy({
      by: ["senderType"],
      _sum: { assignedLimit: true },
    }),
  ]);

  const assignedMap = assignedByType.reduce<Record<SenderType, number>>(
    (accumulator, row) => {
      accumulator[row.senderType] = row._sum.assignedLimit ?? 0;
      return accumulator;
    },
    {
      [SenderType.GMAIL]: 0,
      [SenderType.DOMAIN]: 0,
      [SenderType.MASK]: 0,
    },
  );

  const rows: Array<{ senderType: SenderType; assignedLimit: number }> = [
    { senderType: SenderType.GMAIL, assignedLimit: input.gmail },
    { senderType: SenderType.DOMAIN, assignedLimit: input.domain },
    { senderType: SenderType.MASK, assignedLimit: input.mask },
  ];

  for (const row of rows) {
    const currentAssigned = currentAllocationMap.get(row.senderType) ?? 0;
    const totalCapacity = capacityMap[row.senderType] ?? 0;
    const remainingCapacity = Math.max(totalCapacity - assignedMap[row.senderType], 0);

    if (row.assignedLimit > currentAssigned && row.assignedLimit > remainingCapacity) {
      throw new AppError("Assigned limit exceeds remaining sender capacity.", 409, {
        senderType: mapSenderType(row.senderType),
        totalCapacity,
        currentlyAssigned: assignedMap[row.senderType],
        currentUserAssigned: currentAssigned,
        requestedAssigned: row.assignedLimit,
        remainingCapacity,
      });
    }
  }

  await prisma.$transaction(
    rows.map((row) =>
      prisma.userSenderAllocation.upsert({
        where: {
          userId_senderType: {
            userId: input.userId,
            senderType: row.senderType,
          },
        },
        create: {
          userId: input.userId,
          senderType: row.senderType,
          assignedLimit: row.assignedLimit,
        },
        update: {
          assignedLimit: row.assignedLimit,
        },
      }),
    ),
  );

  return buildUserUsage(input.userId);
}

export async function getSenderAvailability(input: {
  senderType: SenderType;
  userId: string;
}) {
  const [capacityMap, activeCountMap, usage] = await Promise.all([
    getSenderTypeDailyLimitMap(),
    getSenderTypeActiveCountMap(),
    buildUserUsage(input.userId),
  ]);

  const quota = usage.senderQuotas.find(
    (item) => item.type === mapSenderType(input.senderType),
  );

  return {
    senderType: mapSenderType(input.senderType),
    dailyCapacity: capacityMap[input.senderType] ?? 0,
    activeAccounts: activeCountMap[input.senderType] ?? 0,
    quota,
  };
}

function buildQuotaLabel(senderType: SenderType, userId: string) {
  if (senderType === SenderType.GMAIL) {
    return "Gmail allocation";
  }

  if (senderType === SenderType.DOMAIN) {
    return "Domain allocation";
  }

  return "Mask allocation";
}
