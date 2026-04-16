"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import toast from "react-hot-toast";

import {
  AccessRestricted,
  DashboardSection,
  DataTable,
  EmptyState,
  PageLoadingSkeleton,
  StatCard,
} from "@/components/dashboard/dashboard-primitives";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ROLE,
  SENDER_ACCOUNT_STATUS,
  SENDER_HEALTH_STATUS,
  SENDER_TYPE,
} from "@/constants/enums";
import { getUserErrorMessage } from "@/lib/error-message";
import {
  createSenderAccount,
  deleteSenderAccount,
  getMaskServerHealth,
  getSenderAccountMetrics,
  getSenderAccounts,
  getSenderPolicies,
  testSenderAccount,
  updateSenderAccount,
  updateSenderPolicy,
} from "@/lib/api";
import { cn, formatNumber } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import type { SenderAccountRecord } from "@/types";

type SenderAccountForm = {
  id: string | null;
  type: typeof SENDER_TYPE.GMAIL | typeof SENDER_TYPE.DOMAIN;
  label: string;
  email: string;
  password: string;
  healthStatus: SenderAccountRecord["healthStatus"];
  status: SenderAccountRecord["status"];
};

const emptyForm: SenderAccountForm = {
  id: null,
  type: SENDER_TYPE.GMAIL,
  label: "",
  email: "",
  password: "",
  healthStatus: SENDER_HEALTH_STATUS.ACTIVE,
  status: SENDER_ACCOUNT_STATUS.ACTIVE,
};

const primaryButtonClassName =
  "bg-slate-950 text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800";

function toSafeNumber(value: unknown, fallback = 0) {
  const normalizedValue = Number(value);
  return Number.isFinite(normalizedValue) ? normalizedValue : fallback;
}

export default function SenderInfrastructurePage() {
  const role = useAppSelector((state) => state.auth.user?.role);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<SenderAccountForm>(emptyForm);
  const [gmailLimit, setGmailLimit] = useState("");
  const [domainLimit, setDomainLimit] = useState("");
  const [serverLimit, setServerLimit] = useState("");
  const [deletePendingAccountId, setDeletePendingAccountId] = useState<string | null>(null);
  const [testPendingAccountId, setTestPendingAccountId] = useState<string | null>(null);
  const [policyPendingType, setPolicyPendingType] = useState<"GMAIL" | "DOMAIN" | "MASK" | null>(null);
  const metricsQuery = useQuery({
    queryKey: ["sender-account-metrics"],
    queryFn: getSenderAccountMetrics,
    enabled: role === ROLE.ADMIN,
    refetchInterval: 30_000,
  });
  const accountsQuery = useQuery({
    queryKey: ["sender-accounts"],
    queryFn: getSenderAccounts,
    enabled: role === ROLE.ADMIN,
    refetchInterval: 30_000,
  });
  const policiesQuery = useQuery({
    queryKey: ["sender-policies"],
    queryFn: getSenderPolicies,
    enabled: role === ROLE.ADMIN,
  });
  const maskHealthQuery = useQuery({
    queryKey: ["mask-server-health"],
    queryFn: getMaskServerHealth,
    enabled: role === ROLE.ADMIN,
    refetchInterval: 30_000,
  });
  const saveSenderAccountMutation = useMutation({
    mutationFn: async (value: SenderAccountForm) => {
      if (value.id) {
        return updateSenderAccount(value.id, {
          label: value.label,
          email: value.email,
          status: mapAccountStatus(value.status),
          healthStatus: mapHealthStatus(value.healthStatus),
          ...(value.password ? { password: value.password } : {}),
        });
      }

      return createSenderAccount({
        type: value.type === SENDER_TYPE.GMAIL ? "GMAIL" : "DOMAIN",
        label: value.label,
        email: value.email,
        password: value.password,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sender-accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["sender-account-metrics"] }),
      ]);
      toast.success(
        form.id ? "Sender account updated." : "Sender account added.",
      );
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (error) => {
      toast.error(getUserErrorMessage(error));
    },
  });
  const deleteSenderAccountMutation = useMutation({
    mutationFn: deleteSenderAccount,
    onMutate: async (senderAccountId) => {
      setDeletePendingAccountId(senderAccountId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sender-accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["sender-account-metrics"] }),
      ]);
      toast.success("Sender account deleted.");
    },
    onSettled: () => {
      setDeletePendingAccountId(null);
    },
    onError: (error) => {
      toast.error(getUserErrorMessage(error));
    },
  });
  const testSenderAccountMutation = useMutation({
    mutationFn: testSenderAccount,
    onMutate: async (senderAccountId) => {
      setTestPendingAccountId(senderAccountId);
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["sender-accounts"] });
      if (result.healthStatus === SENDER_HEALTH_STATUS.ACTIVE) {
        toast.success("Account test completed successfully.");
        return;
      }
      toast.error(result.lastHealthMessage ?? "Account verification failed.");
    },
    onSettled: () => {
      setTestPendingAccountId(null);
    },
    onError: (error) => {
      toast.error(getUserErrorMessage(error));
    },
  });
  const savePolicyMutation = useMutation({
    mutationFn: ({
      senderType,
      dailyLimit,
    }: {
      senderType: "GMAIL" | "DOMAIN" | "MASK";
      dailyLimit: number;
    }) => updateSenderPolicy(senderType, dailyLimit),
    onMutate: async ({ senderType }) => {
      setPolicyPendingType(senderType);
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sender-policies"] }),
        queryClient.invalidateQueries({ queryKey: ["sender-accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["sender-account-metrics"] }),
      ]);
      toast.success(
        variables.senderType === "MASK"
          ? "Server policy updated."
          : "Daily sending policy updated.",
      );
    },
    onSettled: () => {
      setPolicyPendingType(null);
    },
    onError: (error) => {
      toast.error(getUserErrorMessage(error));
    },
  });

  const smtpAccounts = useMemo(
    () =>
      (accountsQuery.data ?? []).filter(
        (
          item,
        ): item is SenderAccountRecord & {
          type: typeof SENDER_TYPE.GMAIL | typeof SENDER_TYPE.DOMAIN;
        } =>
          item.type === SENDER_TYPE.GMAIL || item.type === SENDER_TYPE.DOMAIN,
      ),
    [accountsQuery.data],
  );
  const gmailPolicy = policiesQuery.data?.find(
    (item) => item.senderType === SENDER_TYPE.GMAIL,
  );
  const domainPolicy = policiesQuery.data?.find(
    (item) => item.senderType === SENDER_TYPE.DOMAIN,
  );
  const serverPolicy = policiesQuery.data?.find(
    (item) => item.senderType === SENDER_TYPE.MASK,
  );
  const totalServers = 1;
  const gmailDailyCapacity = toSafeNumber(
    metricsQuery.data?.gmailDailyCapacity,
  );
  const domainDailyCapacity = toSafeNumber(
    metricsQuery.data?.domainDailyCapacity,
  );
  const serverTotalCapacity = toSafeNumber(
    metricsQuery.data?.serverTotalCapacity,
    toSafeNumber(serverPolicy?.dailyLimit, 2000),
  );
  const totalCapacity =
    gmailDailyCapacity + domainDailyCapacity + serverTotalCapacity;

  if (role !== ROLE.ADMIN) {
    return (
      <AccessRestricted description="Sender infrastructure is available only to administrators." />
    );
  }

  if (
    metricsQuery.isLoading ||
    accountsQuery.isLoading ||
    policiesQuery.isLoading ||
    maskHealthQuery.isLoading
  ) {
    return <PageLoadingSkeleton />;
  }

  if (
    metricsQuery.isError ||
    accountsQuery.isError ||
    policiesQuery.isError ||
    maskHealthQuery.isError ||
    !metricsQuery.data ||
    !policiesQuery.data ||
    !maskHealthQuery.data
  ) {
    return (
      <EmptyState
        title="Infrastructure unavailable"
        description={
          metricsQuery.error?.message ??
          accountsQuery.error?.message ??
          policiesQuery.error?.message ??
          maskHealthQuery.error?.message ??
          "Sender infrastructure could not be loaded."
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <DashboardSection
        title="Sender infrastructure"
        description="Manage sender accounts, delivery policies, and mask server readiness."
        action={
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="cursor-pointer shadow-[0_18px_35px_rgba(15,23,42,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_45px_rgba(15,23,42,0.24)]"
              disabled={
                metricsQuery.isFetching ||
                accountsQuery.isFetching ||
                policiesQuery.isFetching ||
                maskHealthQuery.isFetching
              }
              onClick={() => {
                void Promise.all([
                  metricsQuery.refetch(),
                  accountsQuery.refetch(),
                  policiesQuery.refetch(),
                  maskHealthQuery.refetch(),
                ]);
              }}
            >
              {metricsQuery.isFetching ||
              accountsQuery.isFetching ||
              policiesQuery.isFetching ||
              maskHealthQuery.isFetching ? (
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
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) {
                  setForm(emptyForm);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className={primaryButtonClassName}
                  onClick={() => setForm(emptyForm)}
                >
                  Add account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  {form.id ? "Edit sender account" : "Add sender account"}
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-slate-500">
                  Register and maintain the sender pool used by delivery
                  workflows.
                </DialogDescription>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <FormField label="Sender type">
                    <Select
                      value={form.type}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          type: value as SenderAccountForm["type"],
                        }))
                      }
                      disabled={Boolean(form.id)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sender type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SENDER_TYPE.GMAIL}>Gmail</SelectItem>
                        <SelectItem value={SENDER_TYPE.DOMAIN}>
                          Domain
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Label">
                    <Input
                      value={form.label}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          label: event.target.value,
                        }))
                      }
                    />
                  </FormField>
                  <FormField label="Email">
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                    />
                  </FormField>
                  <FormField label={form.id ? "Password reset" : "Password"}>
                    <Input
                      type="password"
                      placeholder={
                        form.id
                          ? "Leave blank to keep current credentials"
                          : "Enter mailbox password"
                      }
                      value={form.password}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                    />
                  </FormField>
                  {form.id ? (
                    <>
                      <FormField label="Status">
                        <Select
                          value={form.status}
                          onValueChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              status: value as SenderAccountForm["status"],
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SENDER_ACCOUNT_STATUS.ACTIVE}>
                              Active
                            </SelectItem>
                            <SelectItem value={SENDER_ACCOUNT_STATUS.PAUSED}>
                              Paused
                            </SelectItem>
                            <SelectItem value={SENDER_ACCOUNT_STATUS.ARCHIVED}>
                              Archived
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>
                      <FormField label="Health">
                        <Select
                          value={form.healthStatus}
                          onValueChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              healthStatus:
                                value as SenderAccountForm["healthStatus"],
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SENDER_HEALTH_STATUS.ACTIVE}>
                              Active
                            </SelectItem>
                            <SelectItem
                              value={SENDER_HEALTH_STATUS.NOT_WORKING}
                            >
                              Not working
                            </SelectItem>
                            <SelectItem value={SENDER_HEALTH_STATUS.BURNED}>
                              Burned
                            </SelectItem>
                            <SelectItem value={SENDER_HEALTH_STATUS.BANNED}>
                              Banned
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>
                    </>
                  ) : null}
                </div>
                <Button
                  className={`mt-6 w-full ${primaryButtonClassName}`}
                  disabled={
                    saveSenderAccountMutation.isPending ||
                    !form.label ||
                    !form.email ||
                    (!form.id && !form.password)
                  }
                  onClick={() => saveSenderAccountMutation.mutate(form)}
                >
                  {saveSenderAccountMutation.isPending ? (
                    <>
                      Saving
                      <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    "Save account"
                  )}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        }
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Total Gmail Accounts"
            value={formatNumber(metricsQuery.data.totalGmailAccounts)}
            detail="Gmail mailboxes in the sender pool."
            accentClassName="ring-1 ring-emerald-400/20"
          />
          <StatCard
            label="Total Domain Accounts"
            value={formatNumber(metricsQuery.data.totalDomainAccounts)}
            detail="Domain mailboxes in the sender pool."
            accentClassName="ring-1 ring-sky-400/20"
          />
          <StatCard
            label="Total Servers"
            value={formatNumber(totalServers)}
            detail="Mask delivery servers in the sender pool."
            accentClassName="ring-1 ring-amber-400/20"
          />
          <StatCard
            label="Gmail Daily Capacity"
            value={formatNumber(gmailDailyCapacity)}
            detail="Combined Gmail daily throughput."
            accentClassName="ring-1 ring-emerald-400/20"
          />
          <StatCard
            label="Domains Total Capacity"
            value={formatNumber(domainDailyCapacity)}
            detail="Combined domain daily throughput."
            accentClassName="ring-1 ring-sky-400/20"
          />
          <StatCard
            label="Server Total Capacity"
            value={formatNumber(serverTotalCapacity)}
            detail="Combined server daily throughput."
            accentClassName="ring-1 ring-amber-400/20"
          />
          <div className="xl:col-span-3">
            <StatCard
              label="Total Capacity"
              value={formatNumber(totalCapacity)}
              detail="Combined delivery capacity across mailbox and server pools."
              accentClassName="ring-1 ring-slate-200"
            />
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Daily sending policy"
        description="Set the per-account or per-server daily limit for each sender pool."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="dashboard-card">
            <p className="text-sm font-medium text-slate-900">Gmail policy</p>
            <p className="mt-1 text-sm text-slate-500">
              Daily sending limit applied to each Gmail account.
            </p>
            <div className="mt-5">
              <FormField label="Daily limit / account / day">
                <Input
                  value={gmailLimit || String(gmailPolicy?.dailyLimit ?? "")}
                  onChange={(event) => setGmailLimit(event.target.value)}
                />
              </FormField>
            </div>
            <Button
              className={`mt-6 ${primaryButtonClassName}`}
              disabled={
                policyPendingType === "GMAIL" ||
                !Number(gmailLimit || gmailPolicy?.dailyLimit)
              }
              onClick={() =>
                savePolicyMutation.mutate({
                  senderType: "GMAIL",
                  dailyLimit: Number(
                    gmailLimit || gmailPolicy?.dailyLimit || 0,
                  ),
                })
              }
            >
              {policyPendingType === "GMAIL" ? (
                <>
                  Saving
                  <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                "Save Gmail policy"
              )}
            </Button>
          </div>

          <div className="dashboard-card">
            <p className="text-sm font-medium text-slate-900">Domain policy</p>
            <p className="mt-1 text-sm text-slate-500">
              Daily sending limit applied to each domain account.
            </p>
            <div className="mt-5">
              <FormField label="Daily limit / account / day">
                <Input
                  value={domainLimit || String(domainPolicy?.dailyLimit ?? "")}
                  onChange={(event) => setDomainLimit(event.target.value)}
                />
              </FormField>
            </div>
            <Button
              className={`mt-6 ${primaryButtonClassName}`}
              disabled={
                policyPendingType === "DOMAIN" ||
                !Number(domainLimit || domainPolicy?.dailyLimit)
              }
              onClick={() =>
                savePolicyMutation.mutate({
                  senderType: "DOMAIN",
                  dailyLimit: Number(
                    domainLimit || domainPolicy?.dailyLimit || 0,
                  ),
                })
              }
            >
              {policyPendingType === "DOMAIN" ? (
                <>
                  Saving
                  <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                "Save domain policy"
              )}
            </Button>
          </div>

          <div className="dashboard-card md:col-span-2">
            <p className="text-sm font-medium text-slate-900">Server policy</p>
            <p className="mt-1 text-sm text-slate-500">
              Daily sending limit applied to each server.
            </p>
            <div className="mt-5">
              <FormField label="Daily limit / server / day">
                <Input
                  value={serverLimit || String(serverPolicy?.dailyLimit ?? "")}
                  onChange={(event) => setServerLimit(event.target.value)}
                />
              </FormField>
            </div>
            <Button
              className={`mt-6 ${primaryButtonClassName}`}
              disabled={
                policyPendingType === "MASK" ||
                !Number(serverLimit || serverPolicy?.dailyLimit)
              }
              onClick={() =>
                savePolicyMutation.mutate({
                  senderType: "MASK",
                  dailyLimit: Number(
                    serverLimit || serverPolicy?.dailyLimit || 0,
                  ),
                })
              }
            >
              {policyPendingType === "MASK" ? (
                <>
                  Saving
                  <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                "Save server policy"
              )}
            </Button>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Account status"
        description="Review sender readiness and verify mailbox connectivity."
      >
        {!smtpAccounts.length ? (
          <EmptyState
            title="No sender accounts configured"
            description="Add Gmail and domain accounts to provision sender capacity."
          />
        ) : (
          <DataTable
            headers={[
              "Account",
              "Type",
              "Daily Limit",
              "Credentials",
              "Health",
              "Actions",
            ]}
          >
            {smtpAccounts.map((account) => (
              (() => {
                const isTestingCurrentAccount = testPendingAccountId === account.id;
                const isDeletingCurrentAccount = deletePendingAccountId === account.id;
                return (
              <tr
                key={account.id}
                className="border-b border-slate-200 last:border-0"
              >
                <td className="px-4 py-4">
                  <p className="font-medium text-slate-900">{account.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{account.email}</p>
                </td>
                <td className="px-4 py-4 text-sm capitalize text-slate-600">
                  {account.type}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {formatNumber(account.dailyLimit)}
                </td>
                <td className="px-4 py-4">
                  <Badge
                    variant={account.hasCredentials ? "success" : "warning"}
                  >
                    {account.hasCredentials ? "Configured" : "Missing"}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <Badge variant={getHealthVariant(account.healthStatus)}>
                    {formatHealthLabel(account.healthStatus)}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="cursor-pointer"
                      size="sm"
                      onClick={() => {
                        setForm({
                          id: account.id,
                          type: account.type,
                          label: account.label,
                          email: account.email,
                          password: "",
                          healthStatus: account.healthStatus,
                          status: account.status,
                        });
                        setDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="cursor-pointer"
                      size="sm"
                      disabled={isTestingCurrentAccount}
                      onClick={() =>
                        testSenderAccountMutation.mutate(account.id)
                      }
                    >
                      {isTestingCurrentAccount ? (
                        <>
                          Testing
                          <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                        </>
                      ) : (
                        "Test"
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="danger"
                          className="cursor-pointer"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogTitle className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                          Delete sender account
                        </AlertDialogTitle>
                        <AlertDialogDescription className="mt-2 text-sm text-slate-500">
                          This action removes the selected sender account from
                          the active delivery pool.
                        </AlertDialogDescription>
                        <AlertDialogFooter>
                          <AlertDialogCancel asChild>
                            <Button variant="ghost" className="cursor-pointer">
                              Cancel
                            </Button>
                          </AlertDialogCancel>
                          <AlertDialogAction asChild>
                            <Button
                              variant="danger"
                              className="cursor-pointer"
                              disabled={isDeletingCurrentAccount}
                              onClick={() =>
                                deleteSenderAccountMutation.mutate(account.id)
                              }
                            >
                              {isDeletingCurrentAccount ? (
                                <>
                                  Deleting
                                  <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                                </>
                              ) : (
                                "Delete account"
                              )}
                            </Button>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
                );
              })()
            ))}
          </DataTable>
        )}
      </DashboardSection>

      <DashboardSection
        title="Mask sending server"
        description="Validate backend connectivity to the mask delivery endpoint."
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="dashboard-card">
            <p className="text-sm font-medium text-slate-900">Server health</p>
            <p className="mt-2 text-sm text-slate-500">
              {String(maskHealthQuery.data.details)}
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <MaskMetric
                label="Status"
                value={
                  maskHealthQuery.data.status === "active"
                    ? "Active"
                    : "Not working"
                }
              />
              <MaskMetric
                label="Response time"
                value={`${maskHealthQuery.data.responseTimeMs} ms`}
              />
              <MaskMetric
                label="Endpoint"
                value={maskHealthQuery.data.endpoint}
              />
            </div>
          </div>
          <div className="dashboard-card flex flex-col justify-between">
            <div>
              <Badge
                variant={
                  maskHealthQuery.data.status === "active"
                    ? "success"
                    : "warning"
                }
              >
                {maskHealthQuery.data.status === "active"
                  ? "Server active"
                  : "Server issue"}
              </Badge>
              <p className="mt-4 text-sm text-slate-500">
                Run a backend health check before using the mask sender pool.
              </p>
            </div>
            <Button
              className={cn("mt-6", primaryButtonClassName)}
              onClick={() => maskHealthQuery.refetch()}
            >
              Test mask server
            </Button>
          </div>
        </div>
      </DashboardSection>
    </div>
  );
}

function formatHealthLabel(status: SenderAccountRecord["healthStatus"]) {
  if (status === SENDER_HEALTH_STATUS.NOT_WORKING) {
    return "Not working";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getHealthVariant(status: SenderAccountRecord["healthStatus"]) {
  if (status === SENDER_HEALTH_STATUS.ACTIVE) {
    return "success";
  }

  if (status === SENDER_HEALTH_STATUS.NOT_WORKING) {
    return "warning";
  }

  return "danger";
}

function mapAccountStatus(status: SenderAccountRecord["status"]) {
  if (status === SENDER_ACCOUNT_STATUS.ACTIVE) {
    return "ACTIVE" as const;
  }

  if (status === SENDER_ACCOUNT_STATUS.PAUSED) {
    return "PAUSED" as const;
  }

  return "ARCHIVED" as const;
}

function mapHealthStatus(status: SenderAccountRecord["healthStatus"]) {
  if (status === SENDER_HEALTH_STATUS.ACTIVE) {
    return "ACTIVE" as const;
  }

  if (status === SENDER_HEALTH_STATUS.BURNED) {
    return "BURNED" as const;
  }

  if (status === SENDER_HEALTH_STATUS.BANNED) {
    return "BANNED" as const;
  }

  return "NOT_WORKING" as const;
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function MaskMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}
