"use client";

import { apiRequest } from "@/lib/api-request";
import type {
  AuthSessionResponse,
  MaskServerHealthRecord,
  OverviewResponse,
  ProfileRecord,
  SenderAccountMetrics,
  SenderAccountRecord,
  SenderPolicyRecord,
  SenderQuota,
  UserRecord,
  UserUsage,
} from "@/types";

export function loginRequest(input: { email: string; password: string }) {
  return apiRequest<AuthSessionResponse>({
    path: "/api/auth/login",
    method: "POST",
    body: input,
    auth: false,
  });
}

export function logoutRequest(refreshToken: string) {
  return apiRequest<{ revoked: boolean }>({
    path: "/api/auth/logout",
    method: "POST",
    body: { refreshToken },
    auth: false,
  });
}

export function getOverview() {
  return apiRequest<OverviewResponse>({ path: "/api/overview" });
}

export function getUsage() {
  return apiRequest<UserUsage[]>({ path: "/api/usage" });
}

export function getSenderCards() {
  return apiRequest<SenderQuota[]>({ path: "/api/sender-cards" });
}

export function assignLimits(input: { userId: string; gmail: number; domain: number; mask: number }) {
  return apiRequest<UserUsage>({
    path: "/api/limits/assign",
    method: "POST",
    body: input,
  });
}

export function getUsers() {
  return apiRequest<UserRecord[]>({ path: "/api/users" });
}

export function createUser(input: {
  firstName: string;
  lastName: string;
  pseudoName: string;
  email: string;
  role: UserRecord["role"];
  password?: string;
}) {
  return apiRequest<UserRecord>({
    path: "/api/users",
    method: "POST",
    body: {
      ...input,
      role: input.role,
    },
  });
}

export function updateUser(userId: string, input: Partial<{
  firstName: string;
  lastName: string;
  pseudoName: string;
  email: string;
  role: UserRecord["role"];
  password: string;
}>) {
  return apiRequest<UserRecord>({
    path: `/api/users/${userId}`,
    method: "PATCH",
    body: input,
  });
}

export function deleteUser(userId: string) {
  return apiRequest<{ deleted: boolean }>({
    path: `/api/users/${userId}`,
    method: "DELETE",
  });
}

export function terminateUserSession(userId: string) {
  return apiRequest<{ terminated: boolean }>({
    path: "/api/users/terminate-session",
    method: "POST",
    body: { userId },
  });
}

export function getProfile() {
  return apiRequest<ProfileRecord>({ path: "/api/profile" });
}

export function updateProfile(input: {
  firstName: string;
  lastName: string;
  pseudoName: string;
  email?: string;
}) {
  return apiRequest<UserRecord>({
    path: "/api/profile",
    method: "PATCH",
    body: input,
  });
}

export function changePassword(input: {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return apiRequest<{ changed: boolean }>({
    path: "/api/profile/password",
    method: "PATCH",
    body: input,
  });
}

export function getSenderAccountMetrics() {
  return apiRequest<SenderAccountMetrics>({ path: "/api/sender-account-metrics" });
}

export function getSenderAccounts() {
  return apiRequest<SenderAccountRecord[]>({ path: "/api/sender-accounts" });
}

export function createSenderAccount(input: {
  type: "GMAIL" | "DOMAIN";
  label: string;
  email: string;
  password: string;
}) {
  return apiRequest<SenderAccountRecord>({
    path: "/api/sender-accounts",
    method: "POST",
    body: input,
  });
}

export function updateSenderAccount(senderAccountId: string, input: Partial<{
  label: string;
  email: string;
  password: string;
  healthStatus: "ACTIVE" | "BURNED" | "BANNED" | "NOT_WORKING";
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
}>) {
  return apiRequest<SenderAccountRecord>({
    path: `/api/sender-accounts/${senderAccountId}`,
    method: "PATCH",
    body: input,
  });
}

export function deleteSenderAccount(senderAccountId: string) {
  return apiRequest<{ deleted: boolean }>({
    path: `/api/sender-accounts/${senderAccountId}`,
    method: "DELETE",
  });
}

export function testSenderAccount(senderAccountId: string) {
  return apiRequest<{
    id: string;
    healthStatus: SenderAccountRecord["healthStatus"];
    lastHealthCheckAt: string | null;
    lastHealthMessage: string | null;
  }>({
    path: `/api/sender-accounts/${senderAccountId}/test`,
    method: "POST",
  });
}

export function getSenderPolicies() {
  return apiRequest<SenderPolicyRecord[]>({ path: "/api/sender-policies" });
}

export function updateSenderPolicy(senderType: "GMAIL" | "DOMAIN" | "MASK", dailyLimit: number) {
  return apiRequest<SenderPolicyRecord>({
    path: `/api/sender-policies/${senderType}`,
    method: "PUT",
    body: { dailyLimit },
  });
}

export function getMaskServerHealth() {
  return apiRequest<MaskServerHealthRecord>({ path: "/api/mask-server/health" });
}

export function sendGmailCampaign(input: Record<string, unknown>) {
  return apiRequest<{ id: string; status: string; recipientCount: number }>({
    path: "/api/gmail-sender/send",
    method: "POST",
    body: input,
  });
}

export function sendDomainCampaign(input: Record<string, unknown>) {
  return apiRequest<{ id: string; status: string; recipientCount: number }>({
    path: "/api/domain-sender/send",
    method: "POST",
    body: input,
  });
}

export function sendMaskCampaign(input: Record<string, unknown>) {
  return apiRequest<{ id: string; status: string; recipientCount: number }>({
    path: "/api/mask-sender/send",
    method: "POST",
    body: input,
  });
}
