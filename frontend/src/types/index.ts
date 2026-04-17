import type { Role, SenderAccountStatus, SenderHealthStatus, SenderType, UserStatus } from "@/constants/enums";
import { SENDER_TYPE } from "@/constants/enums";

export type { AppRoute, OverviewMode, Role, SenderAccountStatus, SenderHealthStatus, SenderType, TemplateKey, UserStatus } from "@/constants/enums";

export type UserRecord = {
  id: string;
  firstName: string;
  lastName: string;
  pseudoName: string;
  email: string;
  role: Role;
  status: UserStatus;
};

export type SenderQuota = {
  id: string;
  type: SenderType;
  label: string;
  totalLimit: number;
  assignedLimit: number;
  used: number;
  remaining?: number;
};

export type UserUsage = {
  userId: string;
  senderQuotas: SenderQuota[];
};

export type ProfileRecord = {
  firstName: string;
  lastName: string;
  pseudoName: string;
  email: string;
};

export type SenderAccountRecord = {
  id: string;
  type: SenderType;
  label: string;
  email: string;
  dailyLimit: number;
  status: SenderAccountStatus;
  healthStatus: SenderHealthStatus;
  lastHealthCheckAt: string | null;
  lastHealthMessage: string | null;
  hasCredentials: boolean;
};

export type SenderPolicyRecord = {
  id?: string;
  senderType: typeof SENDER_TYPE.GMAIL | typeof SENDER_TYPE.DOMAIN | typeof SENDER_TYPE.MASK;
  dailyLimit: number;
};

export type SenderAccountMetrics = {
  totalGmailAccounts: number;
  totalDomainAccounts: number;
  totalServers: number;
  gmailDailyCapacity: number;
  domainDailyCapacity: number;
  serverTotalCapacity: number;
  totalCapacity: number;
};

export type MaskServerHealthRecord = {
  status: "active" | "not_working";
  responseTimeMs: number;
  endpoint: string;
  details: string;
};

export type OverviewResponse = {
  individual: {
    assigned: number;
    used: number;
    quotaUsedPercent: number;
    senderDistribution: Array<{
      name: string;
      type: SenderType;
      used: number;
      remaining: number;
    }>;
  };
  overall: {
    totalDelivered: number;
    totalAssigned: number;
    senders: Record<
      SenderType,
      {
        assigned: number;
        used: number;
        remaining: number;
      }
    >;
  };
};

export type ContentCheckSection = {
  score: number;
  status: "strong" | "moderate" | "risky";
  findings: string[];
};

export type ContentCheckSignal = {
  tone: "positive" | "warning" | "risk";
  area: "from_name" | "subject" | "preview_text" | "message";
  label: string;
  detail: string;
};

export type ContentCheckResult = {
  score: number;
  riskLevel: "low" | "medium" | "high";
  summary: string;
  sections: {
    fromName: ContentCheckSection;
    subject: ContentCheckSection;
    previewText: ContentCheckSection;
    message: ContentCheckSection;
  };
  suggestions: string[];
  signals: ContentCheckSignal[];
  metrics: {
    messageWordCount: number;
    linkCount: number;
    exclamationCount: number;
    allCapsWordCount: number;
    spamPhraseHits: number;
    legalToneHits: number;
  };
};

export type AuthSessionResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  refreshExpiresIn: string;
  user: UserRecord;
};
