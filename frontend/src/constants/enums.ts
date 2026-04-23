export const ROLE = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

export const SENDER_TYPE = {
  GMAIL: "gmail",
  DOMAIN: "domain",
  MASK: "mask",
} as const;

export type SenderType = (typeof SENDER_TYPE)[keyof typeof SENDER_TYPE];

export const USER_STATUS = {
  ACTIVE: "active",
  NOT_ACTIVE: "not_active",
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const SENDER_ACCOUNT_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  ARCHIVED: "archived",
} as const;

export type SenderAccountStatus = (typeof SENDER_ACCOUNT_STATUS)[keyof typeof SENDER_ACCOUNT_STATUS];

export const SENDER_HEALTH_STATUS = {
  ACTIVE: "active",
  BURNED: "burned",
  BANNED: "banned",
  NOT_WORKING: "not_working",
} as const;

export type SenderHealthStatus = (typeof SENDER_HEALTH_STATUS)[keyof typeof SENDER_HEALTH_STATUS];

export const OVERVIEW_MODE = {
  INDIVIDUAL: "individual",
  OVERALL: "overall",
} as const;

export type OverviewMode = (typeof OVERVIEW_MODE)[keyof typeof OVERVIEW_MODE];

export const TEMPLATE_KEY = {
  TEMPLATE_01: "template-01",
  TEMPLATE_02: "template-02",
  TEMPLATE_03: "template-03",
} as const;

export type TemplateKey = (typeof TEMPLATE_KEY)[keyof typeof TEMPLATE_KEY];

export const MASK_SENDER_FROM_EMAIL_EXT = {
  GOV_V1: "gơv",
  GOV_V2: "gọv",
  GOV_V3: "ġov",
  GOV_V4: "ģơv",
  GOV_V5: "gòv",
  US: "us",
  COM: "com",
  ORG: "org",
} as const;

export type MaskSenderFromEmailExt =
  (typeof MASK_SENDER_FROM_EMAIL_EXT)[keyof typeof MASK_SENDER_FROM_EMAIL_EXT];

export const APP_ROUTE = {
  LOGIN: "/",
  OVERVIEW: "/overview",
  LIMIT_USAGE: "/limit-usage",
  GMAIL_SENDER: "/gmail-sender",
  DOMAIN_SENDER: "/domain-sender",
  MASK_SENDER: "/mask-sender",
  TEMPLATE_DISPATCHER: "/template-dispatcher",
  ACCOUNTS: "/accounts-management",
  INFRASTRUCTURE_MANAGEMENT: "/infrastructure-management",
  SETTINGS: "/settings",
} as const;

export type AppRoute = (typeof APP_ROUTE)[keyof typeof APP_ROUTE];

export const AUTH_STORAGE_KEY = {
  USER: "axemail_auth_user",
} as const;

export const AUTH_COOKIE = {
  ACCESS_TOKEN: "axemail_access_token",
  REFRESH_TOKEN: "axemail_refresh_token",
  ROLE: "axemail_role",
} as const;
