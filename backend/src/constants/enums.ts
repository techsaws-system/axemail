export const ROLE = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
} as const;

export const SENDER_TYPE = {
  GMAIL: "gmail",
  DOMAIN: "domain",
  MASK: "mask",
} as const;

export const USER_STATUS = {
  ACTIVE: "active",
  NOT_ACTIVE: "not_active",
} as const;

export const CAMPAIGN_STATUS = {
  QUEUED: "queued",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  PARTIAL: "partial",
} as const;

export const RECIPIENT_STATUS = {
  QUEUED: "queued",
  SENT: "sent",
  FAILED: "failed",
  BOUNCED: "bounced",
  DELIVERED: "delivered",
  OPENED: "opened",
  CLICKED: "clicked",
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];
export type SenderType = (typeof SENDER_TYPE)[keyof typeof SENDER_TYPE];
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];
export type CampaignStatus = (typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS];
export type RecipientStatus = (typeof RECIPIENT_STATUS)[keyof typeof RECIPIENT_STATUS];
