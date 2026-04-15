import { Role, SenderType } from "@prisma/client";

import type { OverviewDto } from "@/types/api.types";
import { mapSenderType } from "@/utils/enum-mappers";
import { buildUserUsage, getUsageByRole } from "@/services/quota.service";

export async function getOverview(input: { role: Role; userId: string }): Promise<OverviewDto> {
  const [individualUsage, visibleUsage] = await Promise.all([
    buildUserUsage(input.userId),
    getUsageByRole(input.role),
  ]);

  const individualAssigned = individualUsage.senderQuotas.reduce(
    (total, quota) => total + quota.assignedLimit,
    0,
  );
  const individualUsed = individualUsage.senderQuotas.reduce(
    (total, quota) => total + quota.used,
    0,
  );

  const overall = visibleUsage.flatMap((usage) => usage.senderQuotas).reduce(
    (accumulator, quota) => {
      const senderType = quota.type.toUpperCase() as SenderType;
      accumulator[senderType].assigned += quota.assignedLimit;
      accumulator[senderType].used += quota.used;
      accumulator.totalAssigned += quota.assignedLimit;
      accumulator.totalUsed += quota.used;
      return accumulator;
    },
    {
      [SenderType.GMAIL]: { assigned: 0, used: 0 },
      [SenderType.DOMAIN]: { assigned: 0, used: 0 },
      [SenderType.MASK]: { assigned: 0, used: 0 },
      totalAssigned: 0,
      totalUsed: 0,
    },
  );

  return {
    individual: {
      assigned: individualAssigned,
      used: individualUsed,
      quotaUsedPercent:
        individualAssigned === 0 ? 0 : (individualUsed / individualAssigned) * 100,
      senderDistribution: individualUsage.senderQuotas.map((quota) => ({
        name:
          quota.type === "gmail"
            ? "Gmail"
            : quota.type === "domain"
              ? "Domain"
              : "Mask",
        type: quota.type,
        used: quota.used,
        remaining: quota.remaining,
      })),
    },
    overall: {
      totalDelivered: overall.totalUsed,
      totalAssigned: overall.totalAssigned,
      senders: {
        gmail: {
          assigned: overall[SenderType.GMAIL].assigned,
          used: overall[SenderType.GMAIL].used,
          remaining: Math.max(
            overall[SenderType.GMAIL].assigned - overall[SenderType.GMAIL].used,
            0,
          ),
        },
        domain: {
          assigned: overall[SenderType.DOMAIN].assigned,
          used: overall[SenderType.DOMAIN].used,
          remaining: Math.max(
            overall[SenderType.DOMAIN].assigned - overall[SenderType.DOMAIN].used,
            0,
          ),
        },
        mask: {
          assigned: overall[SenderType.MASK].assigned,
          used: overall[SenderType.MASK].used,
          remaining: Math.max(
            overall[SenderType.MASK].assigned - overall[SenderType.MASK].used,
            0,
          ),
        },
      } as Record<ReturnType<typeof mapSenderType>, { assigned: number; used: number; remaining: number }>,
    },
  };
}
