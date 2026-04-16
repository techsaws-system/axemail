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
import { ROLE, USER_STATUS } from "@/constants/enums";
import {
  createUser,
  deleteUser,
  getUsers,
  terminateUserSession,
  updateUser,
} from "@/lib/api";
import { getUserErrorMessage } from "@/lib/error-message";
import { useAppSelector } from "@/store/hooks";
import type { Role, UserRecord } from "@/types";

type UserFormState = {
  id: string | null;
  firstName: string;
  lastName: string;
  pseudoName: string;
  email: string;
  role: Role;
  password: string;
};

const emptyForm: UserFormState = {
  id: null,
  firstName: "",
  lastName: "",
  pseudoName: "",
  email: "",
  role: ROLE.EMPLOYEE,
  password: "",
};

const primaryButtonClassName =
  "bg-slate-950 text-white cursor-pointer shadow-[0_18px_35px_rgba(15,23,42,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_22px_45px_rgba(15,23,42,0.24)]";

export default function AccountsManagementPage() {
  const role = useAppSelector((state) => state.auth.user?.role);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [deletePendingUserId, setDeletePendingUserId] = useState<string | null>(null);
  const [terminatePendingUserId, setTerminatePendingUserId] = useState<string | null>(null);
  const isAdmin = role === ROLE.ADMIN;
  const isManager = role === ROLE.MANAGER;
  const usersQuery = useQuery({
    queryKey: ["users", role],
    queryFn: getUsers,
    enabled: isAdmin || isManager,
  });
  const saveUserMutation = useMutation({
    mutationFn: async (value: UserFormState) => {
      if (value.id) {
        return updateUser(value.id, {
          firstName: value.firstName,
          lastName: value.lastName,
          pseudoName: value.pseudoName,
          email: value.email,
          role: value.role,
          ...(value.password ? { password: value.password } : {}),
        });
      }

      return createUser({
        firstName: value.firstName,
        lastName: value.lastName,
        pseudoName: value.pseudoName,
        email: value.email,
        role: value.role,
        ...(value.password ? { password: value.password } : {}),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(form.id ? "Account updated." : "Account created.");
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (error) => {
      toast.error(getUserErrorMessage(error));
    },
  });
  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onMutate: async (userId) => {
      setDeletePendingUserId(userId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Account deleted.");
    },
    onSettled: () => {
      setDeletePendingUserId(null);
    },
    onError: (error) => {
      toast.error(getUserErrorMessage(error));
    },
  });
  const terminateSessionMutation = useMutation({
    mutationFn: terminateUserSession,
    onMutate: async (userId) => {
      setTerminatePendingUserId(userId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Session terminated successfully.");
    },
    onSettled: () => {
      setTerminatePendingUserId(null);
    },
    onError: (error) => {
      toast.error(getUserErrorMessage(error));
    },
  });

  const userRows = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  if (!isAdmin && !isManager) {
    return (
      <AccessRestricted description="Accounts management is available to administrators and managers." />
    );
  }

  if (usersQuery.isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (usersQuery.isError) {
    return (
      <EmptyState
        title="Accounts unavailable"
        description={usersQuery.error.message}
      />
    );
  }

  return (
    <DashboardSection
      title="Accounts"
      description={
        isAdmin
          ? "Manage managers and employees, and monitor current activity."
          : "Monitor employee activity and terminate active sessions when needed."
      }
      action={
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="cursor-pointer shadow-[0_18px_35px_rgba(15,23,42,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_45px_rgba(15,23,42,0.24)]"
            disabled={usersQuery.isFetching}
            onClick={() => {
              void usersQuery.refetch();
            }}
          >
            {usersQuery.isFetching ? (
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
          {isAdmin ? (
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
                  Add user
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  {form.id ? "Edit account" : "Create account"}
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-slate-500">
                  Configure the user profile and workspace access.
                </DialogDescription>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <FormField label="First name">
                    <Input
                      value={form.firstName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          firstName: event.target.value,
                        }))
                      }
                    />
                  </FormField>
                  <FormField label="Last name">
                    <Input
                      value={form.lastName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          lastName: event.target.value,
                        }))
                      }
                    />
                  </FormField>
                  <FormField label="Pseudo name">
                    <Input
                      value={form.pseudoName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          pseudoName: event.target.value,
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
                  <FormField label="Role">
                    <Select
                      value={form.role}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          role: value as Role,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ROLE.MANAGER}>Manager</SelectItem>
                        <SelectItem value={ROLE.EMPLOYEE}>Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label={form.id ? "Password reset" : "Password"}>
                    <Input
                      type="password"
                      placeholder={
                        form.id
                          ? "Leave blank to keep current password"
                          : "Minimum 8 characters"
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
                </div>
                <Button
                  className={`mt-6 w-full cursor-pointer ${primaryButtonClassName}`}
                  disabled={
                    saveUserMutation.isPending ||
                    !form.firstName ||
                    !form.lastName ||
                    !form.pseudoName ||
                    !form.email ||
                    !form.role ||
                    (!form.id && form.password.length < 8) ||
                    (form.id !== null &&
                      form.password.length > 0 &&
                      form.password.length < 8)
                  }
                  onClick={() => saveUserMutation.mutate(form)}
                >
                  {saveUserMutation.isPending ? (
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
          ) : null}
        </div>
      }
    >
      {!userRows.length ? (
        <EmptyState
          title="No accounts configured"
          description="No workspace accounts are available in your scope."
        />
      ) : (
        <DataTable headers={["Name", "Role", "Status", "Actions"]}>
            {userRows.map((user) => {
              const isActive = user.status === USER_STATUS.ACTIVE;
              const isDeletingCurrentUser = deletePendingUserId === user.id;
              const isTerminatingCurrentUser = terminatePendingUserId === user.id;

              return (
              <tr
                key={user.id}
                className="border-b border-slate-200 last:border-0"
              >
                <td className="px-4 py-4">
                  <p className="font-medium text-slate-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {user.role}
                </td>
                <td className="px-4 py-4">
                  <Badge variant={getUserStatusVariant(user.status)}>
                    {user.status === USER_STATUS.ACTIVE
                      ? "Active"
                      : "Not active"}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    {isAdmin ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setForm({
                              id: user.id,
                              firstName: user.firstName,
                              lastName: user.lastName,
                              pseudoName: user.pseudoName,
                              email: user.email,
                              role: user.role,
                              password: "",
                            });
                            setDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              className="cursor-pointer"
                              variant="ghost"
                              size="sm"
                            >
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                              Delete account
                            </AlertDialogTitle>
                            <AlertDialogDescription className="mt-2 text-sm text-slate-500">
                              This action removes the selected workspace account
                              permanently.
                            </AlertDialogDescription>
                            <AlertDialogFooter>
                              <AlertDialogCancel asChild>
                                <Button
                                  className="cursor-pointer"
                                  variant="ghost"
                                >
                                  Cancel
                                </Button>
                              </AlertDialogCancel>
                              <AlertDialogAction asChild>
                                <Button
                                  className="cursor-pointer"
                                  variant="danger"
                                  disabled={isDeletingCurrentUser}
                                  onClick={() =>
                                    deleteUserMutation.mutate(user.id)
                                  }
                                >
                                  {isDeletingCurrentUser ? (
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
                      </>
                    ) : null}
                    <Button
                      className="cursor-pointer"
                      variant="danger"
                      size="sm"
                      disabled={!isActive || isTerminatingCurrentUser}
                      onClick={() => terminateSessionMutation.mutate(user.id)}
                    >
                      {isTerminatingCurrentUser ? (
                        <>
                          Terminating
                          <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                        </>
                      ) : (
                        "Terminate session"
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </DashboardSection>
  );
}

function getUserStatusVariant(status: UserRecord["status"]) {
  return status === USER_STATUS.ACTIVE ? "success" : "warning";
}

function FormField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
