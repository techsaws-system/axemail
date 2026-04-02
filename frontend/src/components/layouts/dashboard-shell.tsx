"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import DashboardHeader from "@/components/layouts/dashboard-header";
import DashboardSidebar from "@/components/layouts/dashboard-sidebar";
import AccessDenied from "@/components/partials/access-denied";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  canAccessRoute,
  getDefaultRouteForRole,
} from "@/lib/authorization";

function DashboardShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace("/");
      return;
    }

    if (pathname === "/dashboard") {
      router.replace(getDefaultRouteForRole(user.role));
      return;
    }
  }, [loading, pathname, router, user]);

  if (loading || pathname === "/dashboard") {
    return (
      <main className="w-full min-h-screen flex items-center justify-center">
        <Spinner className="h-10 w-10 text-primary" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const isAllowed = canAccessRoute(user.role, pathname);

  return (
    <SidebarProvider>
      <DashboardSidebar userRole={user.role} />
      <SidebarInset>
        <DashboardHeader user={user} />
        {isAllowed ? (
          children
        ) : (
          <AccessDenied homePath={getDefaultRouteForRole(user.role)} />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

export default DashboardShell;
