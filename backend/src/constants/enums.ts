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

export type Role = (typeof ROLE)[keyof typeof ROLE];
export type SenderType = (typeof SENDER_TYPE)[keyof typeof SENDER_TYPE];
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];
