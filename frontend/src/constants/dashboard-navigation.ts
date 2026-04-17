import {
  FileSearch,
  LayoutDashboard,
  Layers3,
  Mail,
  Send,
  ServerCog,
  Settings,
  ShieldUser,
  TableProperties,
  VenetianMask,
} from "lucide-react";
import type { ComponentType } from "react";

import { APP_ROUTE, ROLE, type Role } from "@/constants/enums";

export type DashboardNavItem = {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  roles?: Role[];
};

export type DashboardNavSection = {
  categoryTitle: string;
  items: DashboardNavItem[];
};

export const dashboardNavigation: DashboardNavSection[] = [
  {
    categoryTitle: "Workspace",
    items: [
      { title: "Overview", href: APP_ROUTE.OVERVIEW, icon: LayoutDashboard },
      { title: "Limit and Usages", href: APP_ROUTE.LIMIT_USAGE, icon: Layers3 },
    ],
  },
  {
    categoryTitle: "Senders",
    items: [
      { title: "Gmail Sender", href: APP_ROUTE.GMAIL_SENDER, icon: Mail },
      { title: "Domain Sender", href: APP_ROUTE.DOMAIN_SENDER, icon: Send },
      { title: "Mask Sender", href: APP_ROUTE.MASK_SENDER, icon: VenetianMask },
    ],
  },
  {
    categoryTitle: "Features",
    items: [
      { title: "Template Sender", href: APP_ROUTE.TEMPLATE_SENDER, icon: TableProperties },
      { title: "Content Checker", href: APP_ROUTE.CONTENT_CHECKER, icon: FileSearch },
    ],
  },
  {
    categoryTitle: "Administration",
    items: [
      { title: "Accounts", href: APP_ROUTE.ACCOUNTS, icon: ShieldUser, roles: [ROLE.ADMIN, ROLE.MANAGER] },
      { title: "Infrastructure", href: APP_ROUTE.SMTP_MANAGEMENT, icon: ServerCog, roles: [ROLE.ADMIN] },
    ],
  },
  {
    categoryTitle: "Preferences",
    items: [{ title: "Settings", href: APP_ROUTE.SETTINGS, icon: Settings }],
  },
];

export const dashboardPageTitles: Record<string, { title: string; description: string }> = {
  [APP_ROUTE.OVERVIEW]: { title: "Overview", description: "Delivery performance and sender utilization." },
  [APP_ROUTE.LIMIT_USAGE]: { title: "Limit & Usage", description: "Allocation controls and quota visibility." },
  [APP_ROUTE.GMAIL_SENDER]: { title: "Gmail Sender", description: "Compose and launch Gmail campaigns." },
  [APP_ROUTE.DOMAIN_SENDER]: { title: "Domain Sender", description: "Manage domain campaigns with controlled pacing." },
  [APP_ROUTE.MASK_SENDER]: { title: "Mask Sender", description: "Send alias-based campaigns with masked identities." },
  [APP_ROUTE.TEMPLATE_SENDER]: { title: "Template Sender", description: "Launch approved templates with sender-specific delivery controls." },
  [APP_ROUTE.CONTENT_CHECKER]: { title: "Content Checker", description: "Review subject, preview text, and message spam risk before sending." },
  [APP_ROUTE.ACCOUNTS]: { title: "Accounts Management", description: "User access, status, and role administration." },
  [APP_ROUTE.SMTP_MANAGEMENT]: { title: "Sender Infrastructure", description: "Manage sender accounts, daily limits, and mask server health." },
  [APP_ROUTE.SETTINGS]: { title: "Settings", description: "Profile preferences and account credentials." },
};
