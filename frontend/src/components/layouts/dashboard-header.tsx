"use client";

import { SidebarTrigger } from "../ui/sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardHeader() {
  const { user, loading } = useCurrentUser();

  const formatDate = () =>
    new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const initials =
    user && user.firstName && user.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : "";

  const fullName =
    user && user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : "";

  return (
    <header
      className="h-[90px] border-b-2 border-border bg-sidebar sticky top-0 left-0"
      style={{ boxShadow: "rgba(17, 12, 46, 0.10) 0px 48px 100px 0px" }}
    >
      <div className="dashboard-layout-standard h-full flex items-center justify-between">
        <SidebarTrigger className="-ml-1 text-foreground hover:bg-primary hover:text-primary-foreground cursor-pointer" />

        <div className="flex flex-col items-center text-center w-fit">
          <p className="font-normal text-primary text-xs">{formatDate()}</p>

          {loading ? (
            <Skeleton className="h-5 w-[120px] mt-1" />
          ) : (
            <h1 className="text-heading font-semibold text-lg uppercase">
              {user?.pseudoName}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <>
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[160px]" />
              </div>
            </>
          ) : (
            <>
              <div className="h-10 w-10 rounded-full border bg-white border-border flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">
                  {initials}
                </span>
              </div>

              <div className="flex flex-col leading-tight">
                <span className="text-heading text-sm font-medium">
                  {fullName}
                </span>
                <span className="text-muted-foreground text-xs">
                  {user?.email}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
