"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const DashboardShell = dynamic(
  () =>
    import("@/components/dashboard/dashboard-shell").then((module) => module.DashboardShell),
  {
    ssr: false,
  },
);

export function DashboardLayoutClient({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
