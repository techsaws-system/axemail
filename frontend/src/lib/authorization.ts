"use client";

export type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

export type AppRoute =
  | "/dashboard"
  | "/dashboard/overview"
  | "/dashboard/accounts-management"
  | "/dashboard/limit-usage"
  | "/dashboard/sender-01"
  | "/dashboard/template-sender"
  | "/dashboard/settings";

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  pseudoName?: string;
  email: string;
  role: UserRole;
  dailySendLimit: number;
  managerId?: string | null;
  assignedById?: string | null;
  isActive?: boolean;
}

const ROLE_HOME: Record<UserRole, AppRoute> = {
  ADMIN: "/dashboard/overview",
  MANAGER: "/dashboard/overview",
  EMPLOYEE: "/dashboard/sender-01",
};

const ROUTE_ACCESS: Record<AppRoute, UserRole[]> = {
  "/dashboard": ["ADMIN", "MANAGER", "EMPLOYEE"],
  "/dashboard/overview": ["ADMIN", "MANAGER"],
  "/dashboard/accounts-management": ["ADMIN", "MANAGER"],
  "/dashboard/limit-usage": ["ADMIN", "MANAGER", "EMPLOYEE"],
  "/dashboard/sender-01": ["ADMIN", "MANAGER", "EMPLOYEE"],
  "/dashboard/template-sender": ["ADMIN", "MANAGER", "EMPLOYEE"],
  "/dashboard/settings": ["ADMIN", "MANAGER", "EMPLOYEE"],
};

export const getDefaultRouteForRole = (role: UserRole): AppRoute => {
  return ROLE_HOME[role];
};

export const canAccessRoute = (
  role: UserRole,
  pathname: string,
) => {
  const allowedRoles = ROUTE_ACCESS[pathname as AppRoute];

  if (!allowedRoles) {
    return false;
  }

  return allowedRoles.includes(role);
};
