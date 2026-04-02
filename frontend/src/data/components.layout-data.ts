import { LayoutDashboard, Mails, Settings, Paperclip, UsersRound, ChartColumn } from "lucide-react";

import type { UserRole } from "@/lib/authorization";

export const DashboardSidebarNavLinks = [
  {
    title: "Dashboard Overview",
    icon: LayoutDashboard,
    path: "/dashboard/overview",
    roles: ["ADMIN", "MANAGER"] as UserRole[],
  },
  {
    title: "Accounts Management",
    icon: UsersRound,
    path: "/dashboard/accounts-management",
    roles: ["ADMIN", "MANAGER"] as UserRole[],
  },
  {
    title: "Limit & Usage",
    icon: ChartColumn,
    path: "/dashboard/limit-usage",
    roles: ["ADMIN", "MANAGER", "EMPLOYEE"] as UserRole[],
  },
  {
    title: "Email Sender",
    icon: Mails,
    path: "/dashboard/sender-01",
    roles: ["ADMIN", "MANAGER", "EMPLOYEE"] as UserRole[],
  },
  {
    title: "Template Sender",
    icon: Paperclip,
    path: "/dashboard/template-sender",
    roles: ["ADMIN", "MANAGER", "EMPLOYEE"] as UserRole[],
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/dashboard/settings",
    roles: ["ADMIN", "MANAGER", "EMPLOYEE"] as UserRole[],
  },
];
