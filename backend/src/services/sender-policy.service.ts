import { SenderType } from "@prisma/client";

import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";
import { mapSenderType } from "@/utils/enum-mappers";

export async function listSenderPolicies() {
  const policies = await prisma.senderPolicy.findMany({
    orderBy: { senderType: "asc" },
  });

  return policies.map((policy) => ({
    id: policy.id,
    senderType: mapSenderType(policy.senderType),
    dailyLimit: policy.dailyLimit,
  }));
}

export async function updateSenderPolicy(
  senderType: SenderType,
  dailyLimit: number,
) {
  const policy = await prisma.senderPolicy.upsert({
    where: { senderType },
    create: {
      senderType,
      dailyLimit,
    },
    update: {
      dailyLimit,
    },
  });

  await prisma.senderAccount.updateMany({
    where: { type: senderType },
    data: { dailyLimit },
  });

  return {
    id: policy.id,
    senderType: mapSenderType(policy.senderType),
    dailyLimit: policy.dailyLimit,
  };
}
