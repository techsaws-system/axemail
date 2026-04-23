import crypto from "node:crypto";

import { DeliveryStatus, Prisma, SenderType } from "@prisma/client";

import { env } from "@/config/env";
import { prisma } from "@/config/prisma";
import { buildEmailHeaders, buildEnvelope } from "@/services/email-composer.service";
import { resolveUserContext } from "@/services/context.service";
import { dispatchMessage } from "@/services/sender-dispatch.service";
import { getMaskServerHealth } from "@/services/mask-server.service";
import type { SenderComposerPayload } from "@/types/sender.types";
import { AppError } from "@/utils/app-error";
import { startOfTodayUtc } from "@/utils/date";

const reservedDeliveryStatuses = [
  DeliveryStatus.QUEUED,
  DeliveryStatus.SENT,
] as const;

export async function sendComposerCampaign(input: SenderComposerPayload) {
  const user = await resolveUserContext({ role: input.role, userId: input.userId });
  const deliveryId = crypto.randomUUID();

  const reservedDelivery = await retrySerializable(async () => {
    return prisma.$transaction(async (transaction) => {
      return reserveDelivery(transaction, {
        deliveryId,
        userId: user.id,
        senderType: input.senderType,
        to: input.to,
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  });

  return processDelivery({
    deliveryId: reservedDelivery.id,
    recipientCount: reservedDelivery.recipientCount,
    userId: user.id,
    senderType: input.senderType.toUpperCase() as SenderType,
    fromName: input.fromName,
    fromEmail: input.fromEmail,
    replyTo: input.replyTo,
    cc: splitAddresses(input.cc),
    bcc: splitAddresses(input.bcc),
    subject: input.subject,
    previewText: input.previewText,
    html: input.content,
    attachments: input.attachments ?? [],
  });
}

async function processDelivery(input: {
  deliveryId: string;
  recipientCount: number;
  userId: string;
  senderType: SenderType;
  fromName: string;
  fromEmail?: string;
  replyTo: string;
  cc: string[];
  bcc: string[];
  subject: string;
  previewText?: string;
  html: string;
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
    contentBase64: string;
  }>;
}) {
  const deliveries = await prisma.deliveryRecord.findMany({
    where: {
      deliveryId: input.deliveryId,
      status: DeliveryStatus.QUEUED,
    },
    orderBy: { createdAt: "asc" },
  });

  if (!deliveries.length) {
    throw new AppError("Delivery is not available for processing.", 409);
  }

  let sentCount = 0;
  let failedCount = 0;

  for (let index = 0; index < deliveries.length; index += 1) {
    const delivery = deliveries[index];
    const isMaskSender = input.senderType === SenderType.MASK;

    if (!isMaskSender && !delivery.senderAccountId) {
      await prisma.deliveryRecord.update({
        where: { id: delivery.id },
        data: {
          status: DeliveryStatus.FAILED,
          errorMessage: "Reserved sender account is missing.",
        },
      });
      failedCount += 1;
      continue;
    }

    const assignedAccount = delivery.senderAccountId
      ? await prisma.senderAccount.findUnique({
          where: { id: delivery.senderAccountId },
        })
      : null;

    if (
      !isMaskSender &&
      (!assignedAccount ||
        assignedAccount.status !== "ACTIVE" ||
        assignedAccount.healthStatus !== "ACTIVE")
    ) {
      await prisma.deliveryRecord.update({
        where: { id: delivery.id },
        data: {
          status: DeliveryStatus.FAILED,
          errorMessage: "Reserved sender account is not available.",
        },
      });
      failedCount += 1;
      continue;
    }

    const senderEmail =
      input.senderType === SenderType.MASK
        ? input.fromEmail ?? ""
        : assignedAccount!.email;

    const headers = buildEmailHeaders({
      deliveryId: input.deliveryId,
      deliveryRecordId: delivery.id,
      senderType: input.senderType.toLowerCase(),
      previewText: input.previewText,
    });

    const dispatchPayload = {
      provider: assignedAccount?.provider ?? "mask-vps",
      senderAccountId: assignedAccount?.id ?? "mask-server",
      senderEmail,
      senderName: input.fromName,
      to: delivery.recipientEmail,
      cc: input.cc,
      bcc: input.bcc,
      replyTo: input.replyTo,
      subject: input.subject,
      previewText: input.previewText,
      html: input.html,
      attachments: input.attachments,
      headers,
      envelope: buildEnvelope({
        provider: assignedAccount?.provider ?? "mask-vps",
        senderAccountId: assignedAccount?.id ?? "mask-server",
        senderEmail,
        senderName: input.fromName,
        to: delivery.recipientEmail,
        cc: input.cc,
        bcc: input.bcc,
        replyTo: input.replyTo,
        subject: input.subject,
        previewText: input.previewText,
        html: input.html,
        attachments: input.attachments,
        headers,
        envelope: { from: senderEmail, to: [] },
        metadata: {
          deliveryId: input.deliveryId,
          deliveryRecordId: delivery.id,
          userId: input.userId,
        },
      }),
      metadata: {
        deliveryId: input.deliveryId,
        deliveryRecordId: delivery.id,
        userId: input.userId,
      },
    };

    try {
      const result = await dispatchMessage(
        input.senderType,
        assignedAccount ?? {
          email: senderEmail,
          provider: "mask-vps",
        },
        dispatchPayload,
      );

      await prisma.deliveryRecord.update({
        where: { id: delivery.id },
        data: {
          status: DeliveryStatus.SENT,
          providerMessageId: result.providerMessageId,
          messageIdHeader: headers["Message-ID"],
          sentAt: new Date(),
        },
      });

      sentCount += 1;
    } catch (error) {
      console.error("Dispatch failed.", {
        deliveryId: input.deliveryId,
        deliveryRecordId: delivery.id,
        error,
      });

      await prisma.deliveryRecord.update({
        where: { id: delivery.id },
        data: {
          status: DeliveryStatus.FAILED,
          messageIdHeader: headers["Message-ID"],
          errorMessage: error instanceof Error ? error.message : "Dispatch failed.",
        },
      });

      failedCount += 1;
    }

    if (
      (input.senderType === SenderType.DOMAIN || input.senderType === SenderType.GMAIL) &&
      index < deliveries.length - 1
    ) {
      await sleep(getCooldownSeconds(input.senderType) * 1000);
    }
  }

  const finalStatus =
    failedCount === 0
      ? "completed"
      : sentCount === 0
        ? "failed"
        : "partial";

  return {
    id: input.deliveryId,
    status: finalStatus,
    recipientCount: input.recipientCount,
  };
}

async function reserveDelivery(
  transaction: Prisma.TransactionClient,
  input: {
    deliveryId: string;
    userId: string;
    senderType: "gmail" | "domain" | "mask";
    to: string;
  },
) {
  const senderType = input.senderType.toUpperCase() as SenderType;
  const recipients = splitAddresses(input.to);

  if (!recipients.length) {
    throw new AppError("At least one recipient is required.", 400);
  }

  const allocation = await transaction.userSenderAllocation.findUnique({
    where: {
      userId_senderType: {
        userId: input.userId,
        senderType,
      },
    },
  });

  const assignedLimit = allocation?.assignedLimit ?? 0;

  const reservedForUser = await transaction.deliveryRecord.count({
    where: {
      userId: input.userId,
      senderType,
      createdAt: { gte: startOfTodayUtc() },
      status: { in: reservedDeliveryStatuses as unknown as DeliveryStatus[] },
    },
  });

  const remainingQuota = Math.max(assignedLimit - reservedForUser, 0);

  if (remainingQuota < recipients.length) {
    throw new AppError("Assigned sender quota exceeded.", 409, {
      remaining: remainingQuota,
    });
  }

  const accountAssignments = await reserveSenderAccounts(transaction, senderType, recipients.length);

  await transaction.deliveryRecord.createMany({
    data: recipients.map((recipientEmail, index) => ({
      deliveryId: input.deliveryId,
      userId: input.userId,
      senderType,
      recipientEmail,
      senderAccountId: accountAssignments[index]?.id ?? null,
      status: DeliveryStatus.QUEUED,
    })),
  });

  return {
    id: input.deliveryId,
    recipientCount: recipients.length,
  };
}

async function reserveSenderAccounts(
  transaction: Prisma.TransactionClient,
  senderType: SenderType,
  recipientCount: number,
) {
  if (senderType === SenderType.MASK) {
    const health = await getMaskServerHealth();

    if (health.status !== "active") {
      throw new AppError("Mask server is not working.", 409);
    }

    const policy = await transaction.senderPolicy.findUnique({
      where: { senderType: SenderType.MASK },
    });

    const dailyLimit = policy?.dailyLimit ?? 2000;
    const usedToday = await transaction.deliveryRecord.count({
      where: {
        senderType: SenderType.MASK,
        createdAt: { gte: startOfTodayUtc() },
        status: { in: reservedDeliveryStatuses as unknown as DeliveryStatus[] },
      },
    });

    const remaining = Math.max(dailyLimit - usedToday, 0);

    if (remaining < recipientCount) {
      throw new AppError("Provider daily capacity exceeded.", 409, {
        totalAvailable: remaining,
        requested: recipientCount,
      });
    }

    return Array.from({ length: recipientCount }, () => null);
  }

  const accounts = await transaction.senderAccount.findMany({
    where: { type: senderType, status: "ACTIVE", healthStatus: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });

  if (!accounts.length) {
    throw new AppError("No active sender accounts available.", 409);
  }

  const usageRows = await transaction.deliveryRecord.groupBy({
    by: ["senderAccountId"],
    _count: { _all: true },
    where: {
      senderAccountId: { in: accounts.map((account) => account.id) },
      createdAt: { gte: startOfTodayUtc() },
      status: { in: reservedDeliveryStatuses as unknown as DeliveryStatus[] },
    },
  });

  const usageMap = new Map(usageRows.map((row) => [row.senderAccountId ?? "", row._count._all]));

  const eligible = accounts
    .map((account) => ({
      ...account,
      usedToday: usageMap.get(account.id) ?? 0,
      remaining: Math.max(account.dailyLimit - (usageMap.get(account.id) ?? 0), 0),
    }))
    .filter((account) => account.remaining > 0)
    .sort((left, right) => left.usedToday - right.usedToday);

  const totalAvailable = eligible.reduce((total, account) => total + account.remaining, 0);

  if (totalAvailable < recipientCount) {
    throw new AppError("Provider daily capacity exceeded.", 409, {
      totalAvailable,
      requested: recipientCount,
    });
  }

  const assignments: typeof eligible = [];
  let cursor = 0;

  while (assignments.length < recipientCount) {
    const account = eligible[cursor % eligible.length];
    if (account.remaining > 0) {
      assignments.push(account);
      account.remaining -= 1;
    }
    cursor += 1;
  }

  return assignments;
}

async function retrySerializable<T>(callback: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      return await callback();
    } catch (error) {
      attempt += 1;

      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2034" ||
        attempt >= maxAttempts
      ) {
        throw error;
      }
    }
  }

  throw new AppError("Reservation retry limit exceeded.", 409);
}

function splitAddresses(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getCooldownSeconds(senderType: SenderType) {
  const weights =
    senderType === SenderType.GMAIL
      ? [...env.GMAIL_COOLDOWN_SCHEDULE]
      : [...env.DOMAIN_COOLDOWN_SCHEDULE];
  if (weights.length === 5) {
    weights.unshift(20, 35, 50, 70);
  }
  return weights[Math.floor(Math.random() * weights.length)] ?? 20;
}

function sleep(timeoutMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeoutMs);
  });
}
