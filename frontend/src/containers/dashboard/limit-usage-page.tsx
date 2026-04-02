"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { UserRole } from "@/lib/authorization";
import { apiRequest } from "@/utils/api-request";

interface MyUsageResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    dailySendLimit: number;
  };
  sentToday: number;
  acceptedToday: number;
  rejectedToday: number;
  deferredToday: number;
  remainingToday: number;
  limitUtilizationPercent: number;
}

interface OverviewUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  dailySendLimit: number;
  sentToday: number;
  acceptedToday: number;
  rejectedToday: number;
  deferredToday: number;
  remainingToday: number;
  managerName?: string | null;
}

interface OverviewResponse {
  summary: {
    allocatableLimit: number;
    allocatedLimit: number;
    remainingToAllocate: number;
    activeToday: number;
    idleToday: number;
    totalTrackedUsers: number;
    totalSentToday: number;
  };
  users: OverviewUser[];
}

function StatCard({
  title,
  value,
  tone = "text-heading",
}: {
  title: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <Card className="rounded-none border-border">
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function LimitUsagePage() {
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<"individual" | "overview">("individual");
  const [myUsage, setMyUsage] = useState<MyUsageResponse | null>(null);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [myUsageResponse, overviewResponse] = await Promise.all([
          apiRequest("/analytics/usage/me"),
          user?.role === "ADMIN" || user?.role === "MANAGER"
            ? apiRequest("/analytics/usage/overview")
            : Promise.resolve(null),
        ]);

        setMyUsage(myUsageResponse.data as MyUsageResponse);
        setOverview((overviewResponse?.data as OverviewResponse | undefined) ?? null);
      } catch {
        toast.error("Failed to load usage data");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <main className="dashboard-layout-standard section-padding-standard w-full h-[calc(100svh-90px)] flex-center">
        <Spinner className="h-[40px] w-[40px] text-primary" />
      </main>
    );
  }

  const canViewOverview = user.role === "ADMIN" || user.role === "MANAGER";

  return (
    <main className="dashboard-layout-standard section-padding-standard">
      <h1 className="text-3xl text-heading font-semibold">Limit & Usage</h1>
      <div className="w-full mt-4 mb-8 h-[2px] rounded-full bg-border" />

      <div className="flex flex-wrap gap-3 mb-8">
        <Button
          type="button"
          onClick={() => setActiveTab("individual")}
          className={`rounded-none h-[45px] px-6 ${activeTab === "individual" ? "" : "bg-white text-heading border border-border hover:bg-muted"}`}
        >
          Individual Stats
        </Button>

        {canViewOverview ? (
          <Button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`rounded-none h-[45px] px-6 ${activeTab === "overview" ? "" : "bg-white text-heading border border-border hover:bg-muted"}`}
          >
            Overview
          </Button>
        ) : null}
      </div>

      {activeTab === "individual" ? (
        <>
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-4">
            <StatCard title="My Daily Limit" value={myUsage?.user.dailySendLimit ?? 0} />
            <StatCard title="Sent Today" value={myUsage?.sentToday ?? 0} />
            <StatCard title="Remaining Today" value={myUsage?.remainingToday ?? 0} tone="text-primary" />
            <StatCard title="Utilization" value={`${myUsage?.limitUtilizationPercent ?? 0}%`} />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mt-8">
            <StatCard title="Accepted Today" value={myUsage?.acceptedToday ?? 0} tone="text-green-600" />
            <StatCard title="Rejected Today" value={myUsage?.rejectedToday ?? 0} tone="text-red-600" />
            <StatCard title="Deferred Today" value={myUsage?.deferredToday ?? 0} tone="text-amber-600" />
          </div>

          <Card className="rounded-none border-border mt-8">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-heading">My Usage Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
              <p>
                Account: <span className="font-semibold text-heading">{myUsage?.user.firstName} {myUsage?.user.lastName}</span>
              </p>
              <p>
                Role: <span className="font-semibold text-heading">{myUsage?.user.role}</span>
              </p>
              <p>
                Email: <span className="font-semibold text-heading">{myUsage?.user.email}</span>
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-4">
            <StatCard title="Allocatable Limit" value={overview?.summary.allocatableLimit ?? 0} />
            <StatCard title="Allocated Limit" value={overview?.summary.allocatedLimit ?? 0} />
            <StatCard title="Remaining To Allocate" value={overview?.summary.remainingToAllocate ?? 0} tone="text-primary" />
            <StatCard title="Total Sent Today" value={overview?.summary.totalSentToday ?? 0} />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mt-8">
            <StatCard title="Tracked Users" value={overview?.summary.totalTrackedUsers ?? 0} />
            <StatCard title="Active Today" value={overview?.summary.activeToday ?? 0} tone="text-green-600" />
            <StatCard title="Idle Today" value={overview?.summary.idleToday ?? 0} tone="text-amber-600" />
          </div>

          <Card className="rounded-none border-border mt-8">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-heading">Team Usage Overview</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-4 pr-4 font-semibold text-heading">User</th>
                      <th className="py-4 pr-4 font-semibold text-heading">Role</th>
                      <th className="py-4 pr-4 font-semibold text-heading">Manager</th>
                      <th className="py-4 pr-4 font-semibold text-heading">Limit</th>
                      <th className="py-4 pr-4 font-semibold text-heading">Sent</th>
                      <th className="py-4 pr-4 font-semibold text-heading">Accepted</th>
                      <th className="py-4 pr-4 font-semibold text-heading">Rejected</th>
                      <th className="py-4 pr-4 font-semibold text-heading">Deferred</th>
                      <th className="py-4 pr-4 font-semibold text-heading">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview?.users.map((item) => (
                      <tr key={item.id} className="border-b border-border/70">
                        <td className="py-4 pr-4">
                          <p className="font-semibold text-heading">{item.firstName} {item.lastName}</p>
                          <p className="text-muted-foreground">{item.email}</p>
                        </td>
                        <td className="py-4 pr-4">{item.role}</td>
                        <td className="py-4 pr-4">{item.managerName ?? "Direct / Self"}</td>
                        <td className="py-4 pr-4">{item.dailySendLimit}</td>
                        <td className="py-4 pr-4">{item.sentToday}</td>
                        <td className="py-4 pr-4 text-green-600">{item.acceptedToday}</td>
                        <td className="py-4 pr-4 text-red-600">{item.rejectedToday}</td>
                        <td className="py-4 pr-4 text-amber-600">{item.deferredToday}</td>
                        <td className="py-4 pr-4">{item.remainingToday}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}

export default LimitUsagePage;
