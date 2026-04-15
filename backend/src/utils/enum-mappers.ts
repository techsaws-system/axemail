import { Role, SenderType, UserStatus } from "@prisma/client";

export function mapRole(role: Role) {
  return role;
}

export function mapUserStatus(status: UserStatus) {
  return status.toLowerCase() as "active" | "not_active";
}

export function mapSenderType(type: SenderType) {
  return type.toLowerCase() as "gmail" | "domain" | "mask";
}
