"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import toast from "react-hot-toast";

import {
  DashboardSection,
  DataTable,
  EmptyState,
  PageLoadingSkeleton,
} from "@/components/dashboard/dashboard-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OVERVIEW_MODE, ROLE, SENDER_TYPE } from "@/constants/enums";
import { assignLimits, getUsage, getUsers } from "@/lib/api";
import { getUserErrorMessage } from "@/lib/error-message";
import { formatNumber } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import type { OverviewMode, SenderQuota, UserUsage } from "@/types";

type LimitFormState = {
  userId: string;
  gmail: string;
  domain: string;
  mask: string;
};

type SenderCapacity = Record<
  | typeof SENDER_TYPE.GMAIL
  | typeof SENDER_TYPE.DOMAIN
  | typeof SENDER_TYPE.MASK,
  {
    total: number;
    assigned: number;
    remaining: number;
  }
>;

const emptyForm: LimitFormState = {
  userId: "",
  gmail: "0",
  domain: "0",
  mask: "0",
};

const primaryButtonClassName =
  "bg-slate-950 text-white cursor-pointer shadow-[0_18px_35px_rgba(15,23,42,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_22px_45px_rgba(15,23,42,0.24)]";

const refreshButtonClassName =
  "cursor-pointer shadow-[0_18px_35px_rgba(15,23,42,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_45px_rgba(15,23,42,0.24)]";

function buildFormFromUsage(record?: UserUsage): LimitFormState {
  const quotas = getQuotaMap(record);

  return {
    userId: record?.userId ?? "",
    gmail: String(quotas.gmail.assignedLimit),
    domain: String(quotas.domain.assignedLimit),
    mask: String(quotas.mask.assignedLimit),
  };
}

export default function LimitUsagePage() {
  const queryClient = useQueryClient();
  const role = useAppSelector((state) => state.auth.user?.role);
  const authUser = useAppSelector((state) => state.auth.user);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editOwnOpen, setEditOwnOpen] = useState(false);
  const [form, setForm] = useState<LimitFormState>(emptyForm);
  const [viewMode, setViewMode] = useState<OverviewMode>(
    OVERVIEW_MODE.INDIVIDUAL,
  );

  const usageQuery = useQuery({
    queryKey: ["usage"],
    queryFn: getUsage,
  });
  const usersQuery = useQuery({
    queryKey: ["users", role],
    queryFn: getUsers,
    enabled: role === ROLE.ADMIN || role === ROLE.MANAGER,
  });

  const assignMutation = useMutation({
    mutationFn: assignLimits,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["usage"] }),
        queryClient.invalidateQueries({ queryKey: ["overview"] }),
        queryClient.invalidateQueries({ queryKey: ["sender-cards"] }),
      ]);
      toast.success("Limits updated successfully.");
      setAssignOpen(false);
      setEditOwnOpen(false);
    },
    onError: (error) => {
      toast.error(getUserErrorMessage(error));
    },
  });

  const usageData = useMemo(() => usageQuery.data ?? [], [usageQuery.data]);
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  const userMap = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );
  const currentUserRecord = useMemo(
    () =>
      usageData.find((record) => record.userId === authUser?.id) ??
      usageData[0],
    [authUser?.id, usageData],
  );
  const capacity = useMemo(() => getCapacity(usageData), [usageData]);
  const currentUserQuotas = useMemo(
    () => getQuotaMap(currentUserRecord),
    [currentUserRecord],
  );
  const visibleUsers = useMemo(
    () =>
      role === ROLE.ADMIN
        ? users.filter(
            (user) => user.role === ROLE.MANAGER || user.role === ROLE.EMPLOYEE,
          )
        : users.filter((user) => user.role === ROLE.EMPLOYEE),
    [role, users],
  );
  const tableRecords = useMemo(
    () => usageData.filter((record) => userMap.has(record.userId)),
    [usageData, userMap],
  );
  const visibleUsage = useMemo(
    () => (role === ROLE.EMPLOYEE ? usageData.slice(0, 1) : usageData),
    [role, usageData],
  );
  const individualMetrics = useMemo(
    () => buildMetricCards(currentUserRecord?.senderQuotas ?? []),
    [currentUserRecord],
  );
  const overallMetrics = useMemo(
    () => buildOverallMetricCards(visibleUsage),
    [visibleUsage],
  );
  if (
    !role ||
    usageQuery.isLoading ||
    ((role === ROLE.ADMIN || role === ROLE.MANAGER) && usersQuery.isLoading)
  ) {
    return <PageLoadingSkeleton />;
  }

  if (
    usageQuery.isError ||
    !usageQuery.data ||
    ((role === ROLE.ADMIN || role === ROLE.MANAGER) && usersQuery.isError)
  ) {
    return (
      <EmptyState
        title="Usage unavailable"
        description={
          usageQuery.error?.message ??
          usersQuery.error?.message ??
          "Usage data could not be loaded."
        }
      />
    );
  }

  if (role === ROLE.EMPLOYEE) {
    const record = usageData[0];

    if (!record) {
      return (
        <EmptyState
          title="No allocations"
          description="No sender limits are assigned to this account."
        />
      );
    }

    return (
      <div className="space-y-6">
        <DashboardSection
          title="Assigned sender limits"
          description="Review assigned sender capacity, usage, and remaining balance."
          action={
            <Button
              variant="outline"
              className={refreshButtonClassName}
              disabled={usageQuery.isFetching}
              onClick={() => {
                void usageQuery.refetch();
              }}
            >
              {usageQuery.isFetching ? (
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
          }
        >
          <div className="dashboard-grid">
            {individualMetrics.map((metric) => (
              <QuotaCard key={metric.key} quota={metric} />
            ))}
          </div>
        </DashboardSection>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardSection
        title="Limit and usage"
        description="Manage sender allocations and review delivery usage across your scope."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className={refreshButtonClassName}
              disabled={usageQuery.isFetching || usersQuery.isFetching}
              onClick={() => {
                void Promise.all([usageQuery.refetch(), usersQuery.refetch()]);
              }}
            >
              {usageQuery.isFetching || usersQuery.isFetching ? (
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

            <Dialog
              open={editOwnOpen}
              onOpenChange={(open) => {
                setEditOwnOpen(open);
                if (!open) {
                  setForm(emptyForm);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className={refreshButtonClassName}
                  onClick={() =>
                    setForm({
                      userId: currentUserRecord?.userId ?? "",
                      gmail: String(currentUserQuotas.gmail.assignedLimit),
                      domain: String(currentUserQuotas.domain.assignedLimit),
                      mask: String(currentUserQuotas.mask.assignedLimit),
                    })
                  }
                >
                  Edit own limit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  Edit own limit
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-slate-500">
                  Update your sender allocation within the currently available
                  pool.
                </DialogDescription>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <Field label="Gmail">
                    <Input
                      value={form.gmail}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          gmail: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Domain">
                    <Input
                      value={form.domain}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          domain: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Mask">
                    <Input
                      value={form.mask}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          mask: event.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
                <Button
                  className={`mt-6 w-full ${primaryButtonClassName}`}
                  disabled={assignMutation.isPending || !form.userId}
                  onClick={() => submitAllocationChange("own")}
                >
                  {assignMutation.isPending ? (
                    <>
                      Saving
                      <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    "Save limits"
                  )}
                </Button>
              </DialogContent>
            </Dialog>

            <Dialog
              open={assignOpen}
              onOpenChange={(open) => {
                setAssignOpen(open);
                if (!open) {
                  setForm(emptyForm);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className={primaryButtonClassName}
                  onClick={() =>
                    setForm(
                      buildFormFromUsage(
                        usageData.find(
                          (record) => record.userId === visibleUsers[0]?.id,
                        ),
                      ),
                    )
                  }
                >
                  Assign limit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  Assign sender limits
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-slate-500">
                  Allocate sender capacity within the currently available pool.
                </DialogDescription>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <RemainingCapacity
                    label="Gmail"
                    value={capacity.gmail.remaining}
                  />
                  <RemainingCapacity
                    label="Domain"
                    value={capacity.domain.remaining}
                  />
                  <RemainingCapacity
                    label="Mask"
                    value={capacity.mask.remaining}
                  />
                </div>
                <div className="mt-6 space-y-4">
                  <Field label="Select user">
                    <Select
                      value={form.userId}
                      onValueChange={(value) =>
                        setForm(
                          buildFormFromUsage(
                            usageData.find((record) => record.userId === value),
                          ),
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {visibleUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Gmail">
                      <Input
                        value={form.gmail}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            gmail: event.target.value,
                          }))
                        }
                      />
                    </Field>
                    <Field label="Domain">
                      <Input
                        value={form.domain}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            domain: event.target.value,
                          }))
                        }
                      />
                    </Field>
                    <Field label="Mask">
                      <Input
                        value={form.mask}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            mask: event.target.value,
                          }))
                        }
                      />
                    </Field>
                  </div>
                  <Button
                    className={`w-full ${primaryButtonClassName}`}
                    disabled={assignMutation.isPending || !form.userId}
                    onClick={() => submitAllocationChange("assign")}
                  >
                    {assignMutation.isPending ? (
                      <>
                        Saving
                        <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      "Save allocation"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="cursor-pointer shadow-[0_18px_35px_rgba(15,23,42,0.18)] inline-flex rounded-full border border-slate-200 bg-white p-1">
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  viewMode === OVERVIEW_MODE.INDIVIDUAL
                    ? "bg-slate-950 text-white shadow-[0_12px_24px_rgba(15,23,42,0.14)]"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                onClick={() => setViewMode(OVERVIEW_MODE.INDIVIDUAL)}
              >
                Individual
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  viewMode === OVERVIEW_MODE.OVERALL
                    ? "bg-slate-950 text-white shadow-[0_12px_24px_rgba(15,23,42,0.14)]"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                onClick={() => setViewMode(OVERVIEW_MODE.OVERALL)}
              >
                Overall
              </button>
            </div>
          </div>
        }
      >
        <div className="dashboard-grid">
          {viewMode === OVERVIEW_MODE.INDIVIDUAL
            ? individualMetrics.map((metric) => (
                <QuotaCard key={`${viewMode}-${metric.key}`} quota={metric} />
              ))
            : overallMetrics.map((metric) => (
                <OverallQuotaCard
                  key={`${viewMode}-${metric.key}`}
                  quota={metric}
                />
              ))}
        </div>
      </DashboardSection>

      <DashboardSection
        title="User allocation table"
        description="Assigned limits and utilization across visible users."
      >
        {!tableRecords.length ? (
          <EmptyState
            title="No allocations available"
            description="No visible user allocations are available in your scope."
          />
        ) : (
          <DataTable headers={["User", "Role", "Gmail", "Domain", "Mask"]}>
            {tableRecords.map((record) => {
              const user = userMap.get(record.userId);
              const gmail = record.senderQuotas.find(
                (quota) => quota.type === SENDER_TYPE.GMAIL,
              );
              const domain = record.senderQuotas.find(
                (quota) => quota.type === SENDER_TYPE.DOMAIN,
              );
              const mask = record.senderQuotas.find(
                (quota) => quota.type === SENDER_TYPE.MASK,
              );

              return (
                <tr
                  key={record.userId}
                  className="border-b border-slate-200 last:border-0"
                >
                  <td className="px-4 py-4">
                    <p className="font-medium text-slate-900">
                      {user
                        ? `${user.firstName} ${user.lastName}`
                        : record.userId}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {user?.email ?? ""}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {user?.role ?? role}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatNumber(gmail?.used ?? 0)} /{" "}
                    {formatNumber(gmail?.assignedLimit ?? 0)}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatNumber(domain?.used ?? 0)} /{" "}
                    {formatNumber(domain?.assignedLimit ?? 0)}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatNumber(mask?.used ?? 0)} /{" "}
                    {formatNumber(mask?.assignedLimit ?? 0)}
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </DashboardSection>
    </div>
  );

  function submitAllocationChange(mode: "assign" | "own") {
    const parsed = {
      gmail: Number(form.gmail),
      domain: Number(form.domain),
      mask: Number(form.mask),
    };

    if (
      !Number.isFinite(parsed.gmail) ||
      !Number.isFinite(parsed.domain) ||
      !Number.isFinite(parsed.mask)
    ) {
      toast.error("Required fields are missing or invalid.");
      return;
    }

    if (parsed.gmail < 0 || parsed.domain < 0 || parsed.mask < 0) {
      toast.error("Limits must be zero or greater.");
      return;
    }

    if (!form.userId) {
      toast.error("Please select a user.");
      return;
    }

    const referenceQuotas =
      mode === "own"
        ? currentUserQuotas
        : getQuotaMap(
            usageData.find((record) => record.userId === form.userId),
          );

    if (
      exceedsVisibleScope(
        parsed.gmail,
        referenceQuotas.gmail.assignedLimit,
        capacity.gmail.remaining,
      ) ||
      exceedsVisibleScope(
        parsed.domain,
        referenceQuotas.domain.assignedLimit,
        capacity.domain.remaining,
      ) ||
      exceedsVisibleScope(
        parsed.mask,
        referenceQuotas.mask.assignedLimit,
        capacity.mask.remaining,
      )
    ) {
      toast.error("Limit exceed. Please assign within scope.");
      return;
    }

    assignMutation.mutate({
      userId: form.userId,
      gmail: parsed.gmail,
      domain: parsed.domain,
      mask: parsed.mask,
    });
  }
}

function getCapacity(records: UserUsage[]): SenderCapacity {
  const totals: SenderCapacity = {
    gmail: {
      total:
        records[0]?.senderQuotas.find(
          (quota) => quota.type === SENDER_TYPE.GMAIL,
        )?.totalLimit ?? 0,
      assigned: 0,
      remaining: 0,
    },
    domain: {
      total:
        records[0]?.senderQuotas.find(
          (quota) => quota.type === SENDER_TYPE.DOMAIN,
        )?.totalLimit ?? 0,
      assigned: 0,
      remaining: 0,
    },
    mask: {
      total:
        records[0]?.senderQuotas.find(
          (quota) => quota.type === SENDER_TYPE.MASK,
        )?.totalLimit ?? 0,
      assigned: 0,
      remaining: 0,
    },
  };

  for (const record of records) {
    for (const quota of record.senderQuotas) {
      totals[quota.type].assigned += quota.assignedLimit;
    }
  }

  totals.gmail.remaining = Math.max(
    totals.gmail.total - totals.gmail.assigned,
    0,
  );
  totals.domain.remaining = Math.max(
    totals.domain.total - totals.domain.assigned,
    0,
  );
  totals.mask.remaining = Math.max(totals.mask.total - totals.mask.assigned, 0);

  return totals;
}

function getQuotaMap(record?: UserUsage) {
  return {
    gmail:
      record?.senderQuotas.find((quota) => quota.type === SENDER_TYPE.GMAIL) ??
      emptyQuota(SENDER_TYPE.GMAIL),
    domain:
      record?.senderQuotas.find((quota) => quota.type === SENDER_TYPE.DOMAIN) ??
      emptyQuota(SENDER_TYPE.DOMAIN),
    mask:
      record?.senderQuotas.find((quota) => quota.type === SENDER_TYPE.MASK) ??
      emptyQuota(SENDER_TYPE.MASK),
  };
}

function emptyQuota(
  type:
    | typeof SENDER_TYPE.GMAIL
    | typeof SENDER_TYPE.DOMAIN
    | typeof SENDER_TYPE.MASK,
): SenderQuota {
  return {
    id: `empty-${type}`,
    type,
    label: type,
    totalLimit: 0,
    assignedLimit: 0,
    used: 0,
    remaining: 0,
  };
}

function mergeQuotas(records: UserUsage[]) {
  const merged: Record<
    | typeof SENDER_TYPE.GMAIL
    | typeof SENDER_TYPE.DOMAIN
    | typeof SENDER_TYPE.MASK,
    SenderQuota
  > = {
    [SENDER_TYPE.GMAIL]: emptyQuota(SENDER_TYPE.GMAIL),
    [SENDER_TYPE.DOMAIN]: emptyQuota(SENDER_TYPE.DOMAIN),
    [SENDER_TYPE.MASK]: emptyQuota(SENDER_TYPE.MASK),
  };

  for (const record of records) {
    for (const quota of record.senderQuotas) {
      const currentQuota = merged[quota.type];
      merged[quota.type] = {
        ...currentQuota,
        totalLimit: quota.totalLimit,
        assignedLimit: currentQuota.assignedLimit + quota.assignedLimit,
        used: currentQuota.used + quota.used,
        remaining:
          (currentQuota.remaining ?? 0) +
          (quota.remaining ?? Math.max(quota.assignedLimit - quota.used, 0)),
      };
    }
  }

  return [merged.gmail, merged.domain, merged.mask];
}

function buildMetricCards(quotas: SenderQuota[]) {
  const normalizedQuotas = {
    gmail:
      quotas.find((quota) => quota.type === SENDER_TYPE.GMAIL) ??
      emptyQuota(SENDER_TYPE.GMAIL),
    domain:
      quotas.find((quota) => quota.type === SENDER_TYPE.DOMAIN) ??
      emptyQuota(SENDER_TYPE.DOMAIN),
    mask:
      quotas.find((quota) => quota.type === SENDER_TYPE.MASK) ??
      emptyQuota(SENDER_TYPE.MASK),
  };

  const totalAssigned =
    normalizedQuotas.gmail.assignedLimit +
    normalizedQuotas.domain.assignedLimit +
    normalizedQuotas.mask.assignedLimit;
  const totalUsed =
    normalizedQuotas.gmail.used +
    normalizedQuotas.domain.used +
    normalizedQuotas.mask.used;
  const totalRemaining =
    (normalizedQuotas.gmail.remaining ??
      Math.max(
        normalizedQuotas.gmail.assignedLimit - normalizedQuotas.gmail.used,
        0,
      )) +
    (normalizedQuotas.domain.remaining ??
      Math.max(
        normalizedQuotas.domain.assignedLimit - normalizedQuotas.domain.used,
        0,
      )) +
    (normalizedQuotas.mask.remaining ??
      Math.max(
        normalizedQuotas.mask.assignedLimit - normalizedQuotas.mask.used,
        0,
      ));

  return [
    {
      key: SENDER_TYPE.GMAIL,
      title: "Gmail",
      accentVariant: "success" as const,
      ...normalizedQuotas.gmail,
    },
    {
      key: SENDER_TYPE.DOMAIN,
      title: "Domain",
      accentVariant: "info" as const,
      ...normalizedQuotas.domain,
    },
    {
      key: SENDER_TYPE.MASK,
      title: "Mask",
      accentVariant: "warning" as const,
      ...normalizedQuotas.mask,
    },
    {
      key: "total",
      title: "Total",
      accentVariant: "default" as const,
      id: "total",
      type: SENDER_TYPE.GMAIL,
      label: "Total allocation",
      totalLimit: totalAssigned,
      assignedLimit: totalAssigned,
      used: totalUsed,
      remaining: totalRemaining,
    },
  ];
}

function buildOverallMetricCards(records: UserUsage[]) {
  const totals = getCapacity(records);
  const merged = mergeQuotas(records);
  const gmail =
    merged.find((quota) => quota.type === SENDER_TYPE.GMAIL) ??
    emptyQuota(SENDER_TYPE.GMAIL);
  const domain =
    merged.find((quota) => quota.type === SENDER_TYPE.DOMAIN) ??
    emptyQuota(SENDER_TYPE.DOMAIN);
  const mask =
    merged.find((quota) => quota.type === SENDER_TYPE.MASK) ??
    emptyQuota(SENDER_TYPE.MASK);

  const cards = [
    {
      key: SENDER_TYPE.GMAIL,
      title: "Gmail",
      accentVariant: "success" as const,
      totalLimit: totals.gmail.total,
      assignedLimit: gmail.assignedLimit,
      allocationRemaining: totals.gmail.remaining,
      used: gmail.used,
      sendRemaining: Math.max(gmail.assignedLimit - gmail.used, 0),
    },
    {
      key: SENDER_TYPE.DOMAIN,
      title: "Domain",
      accentVariant: "info" as const,
      totalLimit: totals.domain.total,
      assignedLimit: domain.assignedLimit,
      allocationRemaining: totals.domain.remaining,
      used: domain.used,
      sendRemaining: Math.max(domain.assignedLimit - domain.used, 0),
    },
    {
      key: SENDER_TYPE.MASK,
      title: "Mask",
      accentVariant: "warning" as const,
      totalLimit: totals.mask.total,
      assignedLimit: mask.assignedLimit,
      allocationRemaining: totals.mask.remaining,
      used: mask.used,
      sendRemaining: Math.max(mask.assignedLimit - mask.used, 0),
    },
  ];

  const totalLimit = cards.reduce((sum, card) => sum + card.totalLimit, 0);
  const assignedLimit = cards.reduce(
    (sum, card) => sum + card.assignedLimit,
    0,
  );
  const allocationRemaining = cards.reduce(
    (sum, card) => sum + card.allocationRemaining,
    0,
  );
  const used = cards.reduce((sum, card) => sum + card.used, 0);
  const sendRemaining = cards.reduce(
    (sum, card) => sum + card.sendRemaining,
    0,
  );

  return [
    ...cards,
    {
      key: "total",
      title: "Total",
      accentVariant: "default" as const,
      totalLimit,
      assignedLimit,
      allocationRemaining,
      used,
      sendRemaining,
    },
  ];
}

function exceedsVisibleScope(
  requested: number,
  currentAssigned: number,
  remainingCapacity: number,
) {
  return requested > currentAssigned && requested > remainingCapacity;
}

function QuotaCard({
  quota,
}: {
  quota: {
    key: string;
    title: string;
    accentVariant: "success" | "info" | "warning" | "default";
    assignedLimit: number;
    used: number;
    remaining?: number;
  };
}) {
  const remaining =
    quota.remaining ?? Math.max(quota.assignedLimit - quota.used, 0);
  const progress =
    quota.assignedLimit === 0
      ? 0
      : Math.min((quota.used / quota.assignedLimit) * 100, 100);

  return (
    <div className="dashboard-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-slate-900">{quota.title}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
            {quota.title === "Total"
              ? "Combined allocation"
              : "Assigned sender limit"}
          </p>
        </div>
        <Badge
          variant={
            remaining === 0
              ? "warning"
              : quota.accentVariant === "success"
                ? "success"
                : quota.accentVariant === "warning"
                  ? "warning"
                  : "info"
          }
        >
          {remaining === 0 ? "Exhausted" : "Active"}
        </Badge>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        <MiniMetric
          label="Assigned"
          value={formatNumber(quota.assignedLimit)}
        />
        <MiniMetric label="Used" value={formatNumber(quota.used)} />
        <MiniMetric label="Remaining" value={formatNumber(remaining)} />
      </div>
      <Progress className="mt-5" value={progress} />
    </div>
  );
}

function OverallQuotaCard({
  quota,
}: {
  quota: {
    key: string;
    title: string;
    accentVariant: "success" | "info" | "warning" | "default";
    totalLimit: number;
    assignedLimit: number;
    allocationRemaining: number;
    used: number;
    sendRemaining: number;
  };
}) {
  const progress =
    quota.totalLimit === 0
      ? 0
      : Math.min((quota.assignedLimit / quota.totalLimit) * 100, 100);

  return (
    <div className="dashboard-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-slate-900">{quota.title}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
            {quota.title === "Total"
              ? "Combined sender pool"
              : "Sender pool allocation"}
          </p>
        </div>
        <Badge
          variant={
            quota.allocationRemaining === 0
              ? "warning"
              : quota.accentVariant === "success"
                ? "success"
                : quota.accentVariant === "warning"
                  ? "warning"
                  : "info"
          }
        >
          {quota.allocationRemaining === 0 ? "Allocated" : "Available"}
        </Badge>
      </div>
      <div className="mt-6 grid grid-cols-6 gap-3">
        <div className="col-span-3">
          <MiniMetric label="Limit" value={formatNumber(quota.totalLimit)} />
        </div>
        <div className="col-span-3">
          <MiniMetric
            label="Remaining"
            value={formatNumber(quota.allocationRemaining)}
          />
        </div>
        <div className="col-span-2">
          <MiniMetric
            label="Assigned"
            value={formatNumber(quota.assignedLimit)}
          />
        </div>
        <div className="col-span-2">
          <MiniMetric label="Used" value={formatNumber(quota.used)} />
        </div>
        <div className="col-span-2">
          <MiniMetric
            label="Sent Left"
            value={formatNumber(quota.sendRemaining)}
          />
        </div>
      </div>
      <Progress className="mt-5" value={progress} />
    </div>
  );
}

function RemainingCapacity({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950">
        {formatNumber(value)}
      </p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
