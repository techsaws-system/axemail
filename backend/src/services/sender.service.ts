import { CampaignStatus, Prisma, RecipientStatus, SenderType } from "@prisma/client";

import { env } from "@/config/env";
import { prisma } from "@/config/prisma";
import type { SenderComposerPayload } from "@/types/sender.types";
import { AppError } from "@/utils/app-error";
import { startOfTodayUtc } from "@/utils/date";
import { buildEmailHeaders, buildEnvelope } from "@/services/email-composer.service";
import { resolveUserContext } from "@/services/context.service";
import { getMaskServerHealth } from "@/services/mask-server.service";
import { dispatchMessage } from "@/services/sender-dispatch.service";

const reservedRecipientStatuses = [
  RecipientStatus.QUEUED,
  RecipientStatus.SENT,
  RecipientStatus.DELIVERED,
  RecipientStatus.OPENED,
  RecipientStatus.CLICKED,
] as const;

export async function sendComposerCampaign(input: SenderComposerPayload) {
  const user = await resolveUserContext({ role: input.role, userId: input.userId });

  const reservedCampaign = await retrySerializable(async () => {
    return prisma.$transaction(async (transaction) => {
      return reserveCampaign(transaction, {
        userId: user.id,
        senderType: input.senderType,
        fromName: input.fromName,
        fromEmail: input.fromEmail,
        to: input.to,
        replyTo: input.replyTo,
        cc: splitAddresses(input.cc),
        bcc: splitAddresses(input.bcc),
        subject: input.subject,
        previewText: input.previewText,
        html: input.content,
        attachments: input.attachments ?? [],
        metadata: input.metadata,
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  });

  return processCampaign(reservedCampaign.id, reservedCampaign.recipientCount);
}

async function processCampaign(campaignId: string, recipientCount: number) {
  const started = await prisma.campaign.updateMany({
    where: {
      id: campaignId,
      status: CampaignStatus.QUEUED,
    },
    data: {
      status: CampaignStatus.PROCESSING,
    },
  });

  if (started.count === 0) {
    throw new AppError("Campaign is not available for processing.", 409);
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      recipientEvents: {
        where: { status: RecipientStatus.QUEUED },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!campaign) {
    throw new AppError("Campaign not found.", 404);
  }

  let sentCount = 0;
  let failedCount = 0;

  for (let index = 0; index < campaign.recipientEvents.length; index += 1) {
    const recipient = campaign.recipientEvents[index];
    const isMaskSender = campaign.senderType === SenderType.MASK;

    if (!isMaskSender && !recipient.senderAccountId) {
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          status: RecipientStatus.FAILED,
          errorMessage: "Reserved sender account is missing.",
        },
      });
      failedCount += 1;
      continue;
    }

    const assignedAccount = recipient.senderAccountId
      ? await prisma.senderAccount.findUnique({
          where: { id: recipient.senderAccountId },
        })
      : null;

    if (
      !isMaskSender &&
      (!assignedAccount ||
        assignedAccount.status !== "ACTIVE" ||
        assignedAccount.healthStatus !== "ACTIVE")
    ) {
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          status: RecipientStatus.FAILED,
          errorMessage: "Reserved sender account is not available.",
        },
      });
      failedCount += 1;
      continue;
    }

    const senderType = campaign.senderType;
    const senderEmail =
      senderType === SenderType.MASK
        ? campaign.fromEmail ?? ""
        : assignedAccount!.email;

    const headers = buildEmailHeaders({
      campaignId: campaign.id,
      recipientId: recipient.id,
      senderType: senderType.toLowerCase(),
      previewText: campaign.previewText ?? undefined,
    });

    const dispatchPayload = {
      provider: assignedAccount?.provider ?? "mask-vps",
      senderAccountId: assignedAccount?.id ?? "mask-server",
      senderEmail,
      senderName: campaign.fromName,
      to: recipient.recipientEmail,
      cc: campaign.cc,
      bcc: campaign.bcc,
      replyTo: campaign.replyTo,
      subject: campaign.subject,
      previewText: campaign.previewText ?? undefined,
      html: campaign.contentHtml,
      attachments: normalizeAttachments(campaign.attachments),
      headers,
      envelope: buildEnvelope({
        provider: assignedAccount?.provider ?? "mask-vps",
        senderAccountId: assignedAccount?.id ?? "mask-server",
        senderEmail,
        senderName: campaign.fromName,
        to: recipient.recipientEmail,
        cc: campaign.cc,
        bcc: campaign.bcc,
        replyTo: campaign.replyTo,
        subject: campaign.subject,
        previewText: campaign.previewText ?? undefined,
        html: campaign.contentHtml,
        attachments: normalizeAttachments(campaign.attachments),
        headers,
        envelope: { from: senderEmail, to: [] },
        metadata: {
          campaignId: campaign.id,
          recipientId: recipient.id,
          userId: campaign.userId,
        },
      }),
      metadata: {
        campaignId: campaign.id,
        recipientId: recipient.id,
        userId: campaign.userId,
      },
    };

    try {
      const result = await dispatchMessage(senderType, assignedAccount ?? {
        email: senderEmail,
        provider: "mask-vps",
      }, dispatchPayload);

      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          status: RecipientStatus.SENT,
          providerMessageId: result.providerMessageId,
          messageIdHeader: headers["Message-ID"],
          sentAt: new Date(),
        },
      });

      sentCount += 1;
    } catch (error) {
      console.error("Dispatch failed.", {
        campaignId: campaign.id,
        recipientId: recipient.id,
        error,
      });

      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          status: RecipientStatus.FAILED,
          messageIdHeader: headers["Message-ID"],
          errorMessage: error instanceof Error ? error.message : "Dispatch failed.",
        },
      });

      failedCount += 1;
    }

    if ((senderType === SenderType.DOMAIN || senderType === SenderType.GMAIL) && index < campaign.recipientEvents.length - 1) {
      await sleep(getCooldownSeconds(senderType) * 1000);
    }
  }

  const finalStatus =
    failedCount === 0
      ? CampaignStatus.COMPLETED
      : sentCount === 0
        ? CampaignStatus.FAILED
        : CampaignStatus.PARTIAL;

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      status: finalStatus,
      completedAt: new Date(),
    },
  });

  return {
    id: campaign.id,
    status: finalStatus.toLowerCase(),
    recipientCount,
  };
}

async function reserveCampaign(
  transaction: Prisma.TransactionClient,
  input: {
    userId: string;
    senderType: "gmail" | "domain" | "mask";
    fromName: string;
    fromEmail?: string;
    to: string;
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
    metadata?: Record<string, unknown>;
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

  const reservedForUser = await transaction.campaignRecipient.count({
    where: {
      campaign: {
        userId: input.userId,
        senderType,
        createdAt: { gte: startOfTodayUtc() },
      },
      status: { in: reservedRecipientStatuses as unknown as RecipientStatus[] },
    },
  });

  const remainingQuota = Math.max(assignedLimit - reservedForUser, 0);

  if (remainingQuota < recipients.length) {
    throw new AppError("Assigned sender quota exceeded.", 409, {
      remaining: remainingQuota,
    });
  }

  const accountAssignments = await reserveSenderAccounts(transaction, senderType, recipients.length);

  const campaign = await transaction.campaign.create({
    data: {
      senderType,
      userId: input.userId,
      fromName: input.fromName,
      fromEmail: input.fromEmail,
      replyTo: input.replyTo,
      subject: input.subject,
      previewText: input.previewText,
      cc: input.cc,
      bcc: input.bcc,
      contentHtml: input.html,
      attachments: input.attachments as Prisma.InputJsonValue,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      status: CampaignStatus.QUEUED,
    },
  });

  await transaction.campaignRecipient.createMany({
    data: recipients.map((recipientEmail, index) => ({
      campaignId: campaign.id,
      recipientEmail,
      senderAccountId: accountAssignments[index]?.id ?? null,
      status: RecipientStatus.QUEUED,
    })),
  });

  return {
    id: campaign.id,
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
    const usedToday = await transaction.campaignRecipient.count({
      where: {
        campaign: {
          senderType: SenderType.MASK,
          createdAt: { gte: startOfTodayUtc() },
        },
        status: { in: reservedRecipientStatuses as unknown as RecipientStatus[] },
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

  const usageRows = await transaction.campaignRecipient.groupBy({
    by: ["senderAccountId"],
    _count: { _all: true },
    where: {
      senderAccountId: { in: accounts.map((account) => account.id) },
      createdAt: { gte: startOfTodayUtc() },
      status: { in: reservedRecipientStatuses as unknown as RecipientStatus[] },
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

      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2034" || attempt >= maxAttempts) {
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

function normalizeAttachments(value: Prisma.JsonValue | null) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as Array<{
    filename: string;
    mimeType: string;
    size: number;
    contentBase64: string;
  }>;
}

function sleep(timeoutMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeoutMs);
  });
}
