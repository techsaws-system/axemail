import nodemailer from "nodemailer";
import {
  SenderAccountStatus,
  SenderHealthStatus,
  SenderType,
} from "@prisma/client";

import { prisma } from "@/config/prisma";
import { decryptJson, encryptJson } from "@/utils/crypto";
import { AppError } from "@/utils/app-error";
import { mapSenderType } from "@/utils/enum-mappers";

type SenderAccountDto = {
  id: string;
  type: "gmail" | "domain" | "mask";
  label: string;
  email: string;
  status: "active" | "paused" | "archived";
  healthStatus: "active" | "burned" | "banned" | "not_working";
  lastHealthCheckAt: string | null;
  lastHealthMessage: string | null;
  dailyLimit: number;
  hasCredentials: boolean;
};

export async function getSenderAccountMetrics() {
  const [accounts, policies] = await Promise.all([
    prisma.senderAccount.findMany(),
    prisma.senderPolicy.findMany(),
  ]);

  const gmailAccounts = accounts.filter((item) => item.type === SenderType.GMAIL);
  const domainAccounts = accounts.filter((item) => item.type === SenderType.DOMAIN);
  const serverAccounts = accounts.filter((item) => item.type === SenderType.MASK);
  const maskPolicy = policies.find((item) => item.senderType === SenderType.MASK);
  const serverDailyLimit = maskPolicy?.dailyLimit ?? defaultDailyLimit(SenderType.MASK);
  const totalServers = 1;
  const serverTotalCapacity = serverDailyLimit * totalServers;

  return {
    totalGmailAccounts: gmailAccounts.length,
    totalDomainAccounts: domainAccounts.length,
    totalServers,
    gmailDailyCapacity: gmailAccounts.reduce((total, item) => total + item.dailyLimit, 0),
    domainDailyCapacity: domainAccounts.reduce((total, item) => total + item.dailyLimit, 0),
    serverTotalCapacity,
    totalCapacity:
      gmailAccounts.reduce((total, item) => total + item.dailyLimit, 0) +
      domainAccounts.reduce((total, item) => total + item.dailyLimit, 0) +
      serverTotalCapacity,
  };
}

export async function listSenderAccounts(): Promise<SenderAccountDto[]> {
  const accounts = await prisma.senderAccount.findMany({
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
  });

  return accounts.map((account) => ({
    id: account.id,
    type: mapSenderType(account.type),
    label: account.label,
    email: account.email,
    status: account.status.toLowerCase() as "active" | "paused" | "archived",
    healthStatus: account.healthStatus.toLowerCase() as "active" | "burned" | "banned" | "not_working",
    lastHealthCheckAt: account.lastHealthCheckAt?.toISOString() ?? null,
    lastHealthMessage: account.lastHealthMessage ?? null,
    dailyLimit: account.dailyLimit,
    hasCredentials: Boolean(account.credentialsEncrypted),
  }));
}

export async function createSenderAccount(input: {
  type: SenderType;
  label: string;
  email: string;
  status: SenderAccountStatus;
  healthStatus?: SenderHealthStatus;
  password?: string;
  appPassword?: string;
}) {
  const policy = await prisma.senderPolicy.findUnique({
    where: { senderType: input.type },
  });
  const credentials = buildCredentials(input.type, input);

  const account = await prisma.senderAccount.create({
    data: {
      type: input.type,
      label: input.label,
      email: input.email,
      provider: inferProvider(input.type),
      dailyLimit: policy?.dailyLimit ?? defaultDailyLimit(input.type),
      status: input.status,
      healthStatus: input.healthStatus ?? SenderHealthStatus.ACTIVE,
      credentialsEncrypted: credentials ? encryptJson(credentials) : null,
    },
  });

  return {
    id: account.id,
    type: mapSenderType(account.type),
    label: account.label,
    email: account.email,
    status: account.status.toLowerCase() as "active" | "paused" | "archived",
    healthStatus: account.healthStatus.toLowerCase() as "active" | "burned" | "banned" | "not_working",
    lastHealthCheckAt: account.lastHealthCheckAt?.toISOString() ?? null,
    lastHealthMessage: account.lastHealthMessage ?? null,
    dailyLimit: account.dailyLimit,
    hasCredentials: Boolean(account.credentialsEncrypted),
  };
}

export async function updateSenderAccount(
  senderAccountId: string,
  input: Partial<{
    label: string;
    email: string;
    status: SenderAccountStatus;
    healthStatus: SenderHealthStatus;
    password: string;
    appPassword: string;
  }>,
) {
  const existing = await prisma.senderAccount.findUnique({
    where: { id: senderAccountId },
  });

  if (!existing) {
    throw new AppError("Sender account not found.", 404);
  }

  const credentials = buildCredentials(existing.type, input, false);

  const account = await prisma.senderAccount.update({
    where: { id: senderAccountId },
    data: {
      label: input.label,
      email: input.email,
      status: input.status,
      healthStatus: input.healthStatus,
      credentialsEncrypted: credentials
        ? encryptJson(credentials)
        : undefined,
    },
  });

  return {
    id: account.id,
    type: mapSenderType(account.type),
    label: account.label,
    email: account.email,
    status: account.status.toLowerCase() as "active" | "paused" | "archived",
    healthStatus: account.healthStatus.toLowerCase() as "active" | "burned" | "banned" | "not_working",
    lastHealthCheckAt: account.lastHealthCheckAt?.toISOString() ?? null,
    lastHealthMessage: account.lastHealthMessage ?? null,
    dailyLimit: account.dailyLimit,
    hasCredentials: Boolean(account.credentialsEncrypted),
  };
}

export async function deleteSenderAccount(senderAccountId: string) {
  const existing = await prisma.senderAccount.findUnique({
    where: { id: senderAccountId },
  });

  if (!existing) {
    throw new AppError("Sender account not found.", 404);
  }

  await prisma.senderAccount.delete({ where: { id: senderAccountId } });
  return { deleted: true };
}

export async function testSenderAccount(senderAccountId: string) {
  const account = await prisma.senderAccount.findUnique({
    where: { id: senderAccountId },
  });

  if (!account) {
    throw new AppError("Sender account not found.", 404);
  }

  if (account.type === SenderType.MASK) {
    throw new AppError("Use mask server health endpoint for mask infrastructure.", 400);
  }

  const credentials = decryptJson<{ appPassword?: string; password?: string }>(
    account.credentialsEncrypted,
  );

  if (!credentials) {
    throw new AppError("Account credentials are not configured.", 400);
  }

  const transporter = nodemailer.createTransport(
    account.type === SenderType.GMAIL
      ? {
          service: "gmail",
          auth: {
            user: account.email,
            pass: credentials.appPassword ?? "",
          },
        }
      : {
          host: "smtp.zoho.com",
          port: 465,
          secure: true,
          auth: {
            user: account.email,
            pass: credentials.password ?? "",
          },
        },
  );

  try {
    await transporter.verify();

    const updated = await prisma.senderAccount.update({
      where: { id: senderAccountId },
      data: {
        healthStatus: SenderHealthStatus.ACTIVE,
        lastHealthCheckAt: new Date(),
        lastHealthMessage: "Connection verified successfully.",
      },
    });

    return {
      id: updated.id,
      healthStatus: "active" as const,
      lastHealthCheckAt: updated.lastHealthCheckAt?.toISOString() ?? null,
      lastHealthMessage: updated.lastHealthMessage,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connection verification failed.";

    const updated = await prisma.senderAccount.update({
      where: { id: senderAccountId },
      data: {
        healthStatus: SenderHealthStatus.NOT_WORKING,
        lastHealthCheckAt: new Date(),
        lastHealthMessage: message,
      },
    });

    return {
      id: updated.id,
      healthStatus: "not_working" as const,
      lastHealthCheckAt: updated.lastHealthCheckAt?.toISOString() ?? null,
      lastHealthMessage: updated.lastHealthMessage,
    };
  }
}

function buildCredentials(
  senderType: SenderType,
  input: {
    password?: string;
    appPassword?: string;
  },
  requireForCreate = true,
) {
  if (senderType === SenderType.GMAIL) {
    if (input.appPassword || input.password) {
      return { appPassword: input.appPassword ?? input.password ?? "" };
    }
    if (requireForCreate) {
      throw new AppError("Password is required for Gmail accounts.", 400);
    }
    return null;
  }

  if (senderType === SenderType.DOMAIN) {
    if (input.password) {
      return { password: input.password };
    }
    if (requireForCreate) {
      throw new AppError("Password is required for domain accounts.", 400);
    }
    return null;
  }

  return null;
}

function inferProvider(senderType: SenderType) {
  if (senderType === SenderType.GMAIL) return "gmail";
  if (senderType === SenderType.DOMAIN) return "zoho";
  return "mask-vps";
}

function defaultDailyLimit(senderType: SenderType) {
  if (senderType === SenderType.GMAIL) return 150;
  if (senderType === SenderType.DOMAIN) return 200;
  return 2000;
}
