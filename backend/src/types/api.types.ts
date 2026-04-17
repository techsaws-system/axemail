import type { Role, SenderType, UserStatus } from "@/constants/enums";

export type ApiResponse<T> = {
  data: T;
};

export type UserRecordDto = {
  id: string;
  firstName: string;
  lastName: string;
  pseudoName: string;
  email: string;
  role: Role;
  status: UserStatus;
};

export type ProfileDto = {
  firstName: string;
  lastName: string;
  pseudoName: string;
  email: string;
};

export type SenderQuotaDto = {
  id: string;
  type: SenderType;
  label: string;
  totalLimit: number;
  assignedLimit: number;
  used: number;
  remaining: number;
};

export type UserUsageDto = {
  userId: string;
  senderQuotas: SenderQuotaDto[];
};

export type SenderAnalyticsDto = {
  assigned: number;
  used: number;
  remaining: number;
};

export type OverviewDto = {
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
    senders: Record<SenderType, SenderAnalyticsDto>;
  };
};

export type ContentCheckSectionDto = {
  score: number;
  status: "strong" | "moderate" | "risky";
  findings: string[];
};

export type ContentCheckSignalDto = {
  tone: "positive" | "warning" | "risk";
  area: "from_name" | "subject" | "preview_text" | "message";
  label: string;
  detail: string;
};

export type ContentCheckDto = {
  score: number;
  riskLevel: "low" | "medium" | "high";
  summary: string;
  sections: {
    fromName: ContentCheckSectionDto;
    subject: ContentCheckSectionDto;
    previewText: ContentCheckSectionDto;
    message: ContentCheckSectionDto;
  };
  suggestions: string[];
  signals: ContentCheckSignalDto[];
  metrics: {
    messageWordCount: number;
    linkCount: number;
    exclamationCount: number;
    allCapsWordCount: number;
    spamPhraseHits: number;
    legalToneHits: number;
  };
};
