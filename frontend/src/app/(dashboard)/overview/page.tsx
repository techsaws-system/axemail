"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

import { OVERVIEW_MODE, ROLE, SENDER_TYPE, type OverviewMode, type SenderType } from "@/constants/enums";
import {
  OverallDistributionChart,
  SenderCapacityChart,
  SingleSenderCollectionChart,
} from "@/components/charts/analytics-charts";
import {
  DashboardSection,
  PageLoadingSkeleton,
  StatCard,
} from "@/components/dashboard/dashboard-primitives";
import { Button } from "@/components/ui/button";
import { getOverview } from "@/lib/api";
import { formatNumber, formatPercent } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";

export default function OverviewPage() {
  const role = useAppSelector((state) => state.auth.user?.role);
  const [mode, setMode] = useState<OverviewMode>(OVERVIEW_MODE.INDIVIDUAL);
  const query = useQuery({
    queryKey: ["overview"],
    queryFn: getOverview,
  });

  if (query.isLoading || !query.data || !role) {
    return <PageLoadingSkeleton />;
  }

  const individual = query.data.individual;
  const overall = query.data.overall;
  const isOverallMode = role !== ROLE.EMPLOYEE && mode === OVERVIEW_MODE.OVERALL;

  return (
    <div className="space-y-6">
      <DashboardSection
        title="Core metrics"
        description="Daily delivery and quota utilization."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="cursor-pointer shadow-[0_18px_35px_rgba(15,23,42,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_45px_rgba(15,23,42,0.24)]"
              disabled={query.isFetching}
              onClick={() => {
                void query.refetch();
              }}
            >
              {query.isFetching ? (
                <>
                  Refreshing
                  <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  Refresh data
                  <RefreshCw className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            {role !== ROLE.EMPLOYEE ? (
              <div className="cursor-pointer shadow-[0_18px_35px_rgba(15,23,42,0.18)] flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1">
                <Button
                  variant={
                    mode === OVERVIEW_MODE.INDIVIDUAL ? "default" : "ghost"
                  }
                  size="sm"
                  onClick={() => setMode(OVERVIEW_MODE.INDIVIDUAL)}
                >
                  Individual
                </Button>
                <Button
                  variant={mode === OVERVIEW_MODE.OVERALL ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode(OVERVIEW_MODE.OVERALL)}
                >
                  Overall
                </Button>
              </div>
            ) : null}
          </div>
        }
      >
        <div className="dashboard-grid">
          {isOverallMode ? (
            <>
              <StatCard
                label="Gmail sent"
                value={`${formatNumber(overall.senders.gmail.used)} / ${formatNumber(overall.senders.gmail.assigned)}`}
                detail="Collective Gmail output."
                accentClassName="ring-1 ring-emerald-400/15"
              />
              <StatCard
                label="Domain sent"
                value={`${formatNumber(overall.senders.domain.used)} / ${formatNumber(overall.senders.domain.assigned)}`}
                detail="Collective domain output."
                accentClassName="ring-1 ring-sky-400/15"
              />
              <StatCard
                label="Mask sent"
                value={`${formatNumber(overall.senders.mask.used)} / ${formatNumber(overall.senders.mask.assigned)}`}
                detail="Collective mask output."
                accentClassName="ring-1 ring-amber-400/15"
              />
              <StatCard
                label="Total delivered"
                value={`${formatNumber(overall.totalDelivered)} / ${formatNumber(overall.totalAssigned)}`}
                detail="Combined output across all sender groups."
                accentClassName="ring-1 ring-slate-200"
              />
            </>
          ) : (
            <>
              <StatCard
                label="Total delivered"
                value={`${formatNumber(individual.used)} / ${formatNumber(individual.assigned)}`}
                detail="Output against assigned daily capacity."
                accentClassName="ring-1 ring-emerald-400/15"
              />
              <StatCard
                label="Quota used"
                value={formatPercent(individual.quotaUsedPercent)}
                detail="Share of assigned capacity consumed."
                accentClassName="ring-1 ring-sky-400/15"
              />
            </>
          )}
        </div>
      </DashboardSection>

      <DashboardSection
        title="Analytics"
        description="Sender performance distribution."
      >
        {isOverallMode ? (
          <div className="grid gap-6 xl:grid-cols-2">
            <SingleSenderCollectionChart
              title="Gmail collection"
              data={[
                toChartDatum(
                  "Gmail",
                  overall.senders.gmail.used,
                  overall.senders.gmail.assigned,
                  SENDER_TYPE.GMAIL,
                ),
              ]}
            />
            <SingleSenderCollectionChart
              title="Domain collection"
              data={[
                toChartDatum(
                  "Domain",
                  overall.senders.domain.used,
                  overall.senders.domain.assigned,
                  SENDER_TYPE.DOMAIN,
                ),
              ]}
            />
            <SingleSenderCollectionChart
              title="Mask collection"
              data={[
                toChartDatum(
                  "Mask",
                  overall.senders.mask.used,
                  overall.senders.mask.assigned,
                  SENDER_TYPE.MASK,
                ),
              ]}
            />
            <OverallDistributionChart
              data={[
                toChartDatum(
                  "Gmail",
                  overall.senders.gmail.used,
                  overall.senders.gmail.assigned,
                  SENDER_TYPE.GMAIL,
                ),
                toChartDatum(
                  "Domain",
                  overall.senders.domain.used,
                  overall.senders.domain.assigned,
                  SENDER_TYPE.DOMAIN,
                ),
                toChartDatum(
                  "Mask",
                  overall.senders.mask.used,
                  overall.senders.mask.assigned,
                  SENDER_TYPE.MASK,
                ),
              ]}
            />
          </div>
        ) : (
          <SenderCapacityChart
            title="Sender distribution"
            data={individual.senderDistribution.map((item) =>
              toChartDatum(
                item.name,
                item.used,
                item.used + item.remaining,
                item.type,
              ),
            )}
          />
        )}
      </DashboardSection>
    </div>
  );
}

function toChartDatum(name: string, used: number, assigned: number, type: SenderType) {
  return {
    name,
    used,
    remaining: Math.max(assigned - used, 0),
    color:
      type === SENDER_TYPE.GMAIL
        ? "#22c55e"
        : type === SENDER_TYPE.DOMAIN
          ? "#3b82f6"
          : "#f59e0b",
  };
}
