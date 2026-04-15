"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";

import {
  DashboardSection,
  EmptyState,
  PageLoadingSkeleton,
} from "@/components/dashboard/dashboard-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE } from "@/constants/enums";
import { changePassword, getProfile, updateProfile } from "@/lib/api";
import { persistAuthState } from "@/lib/auth-storage";
import { getUserErrorMessage } from "@/lib/error-message";
import { setAuthState } from "@/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

type ProfileFormState = {
  firstName: string;
  lastName: string;
  pseudoName: string;
  email: string;
};

type PasswordFormState = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const role = useAppSelector((state) => state.auth.user?.role);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const refreshToken = useAppSelector((state) => state.auth.refreshToken);
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });
  const [profileForm, setProfileForm] = useState<ProfileFormState | null>(null);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const initialProfileForm = useMemo<ProfileFormState>(
    () => ({
      firstName: profileQuery.data?.firstName ?? "",
      lastName: profileQuery.data?.lastName ?? "",
      pseudoName: profileQuery.data?.pseudoName ?? "",
      email: profileQuery.data?.email ?? "",
    }),
    [profileQuery.data],
  );
  const currentProfileForm = profileForm ?? initialProfileForm;
  const canEditEmail = role === ROLE.ADMIN;

  const saveProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async (user) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["users"] }),
      ]);

      if (accessToken && refreshToken) {
        persistAuthState({
          accessToken,
          refreshToken,
          user,
        });
        dispatch(
          setAuthState({
            accessToken,
            refreshToken,
            user,
          }),
        );
      }

      toast.success("Profile updated.");
    },
    onError: (error) => {
      toast.error(getUserErrorMessage(error));
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Password updated.");
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => {
      toast.error(getUserErrorMessage(error));
    },
  });

  if (profileQuery.isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <EmptyState
        title="Profile unavailable"
        description={
          profileQuery.isError
            ? profileQuery.error.message
            : "Profile data could not be loaded."
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <DashboardSection
        title="Profile settings"
        description="Maintain account identity information."
      >
        <div className="dashboard-card">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="First name">
              <Input
                value={currentProfileForm.firstName}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...(current ?? initialProfileForm),
                    firstName: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Last name">
              <Input
                value={currentProfileForm.lastName}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...(current ?? initialProfileForm),
                    lastName: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Pseudo name">
              <Input
                value={currentProfileForm.pseudoName}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...(current ?? initialProfileForm),
                    pseudoName: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Email" disabled={!canEditEmail}>
              <Input
                type="email"
                value={currentProfileForm.email}
                disabled={!canEditEmail}
                className={
                  !canEditEmail
                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    : undefined
                }
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...(current ?? initialProfileForm),
                    email: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
          <Button
            className="mt-6 bg-slate-950 text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
            disabled={
              saveProfileMutation.isPending ||
              !currentProfileForm.firstName ||
              !currentProfileForm.lastName ||
              !currentProfileForm.pseudoName ||
              !currentProfileForm.email
            }
            onClick={() =>
              saveProfileMutation.mutate({
                firstName: currentProfileForm.firstName,
                lastName: currentProfileForm.lastName,
                pseudoName: currentProfileForm.pseudoName,
                ...(canEditEmail ? { email: currentProfileForm.email } : {}),
              })
            }
          >
            {saveProfileMutation.isPending ? (
              <>
                Saving
                <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Password"
        description="Update password after verifying the current credential."
      >
        <div className="dashboard-card">
          <div className="grid gap-5 md:grid-cols-2">
            <Field className="md:col-span-2" label="Old password">
              <Input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    oldPassword: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="New password">
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    newPassword: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Confirm password">
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
          <Button
            className="mt-6 bg-slate-950 text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
            disabled={
              changePasswordMutation.isPending ||
              !passwordForm.oldPassword ||
              passwordForm.newPassword.length < 8 ||
              passwordForm.confirmPassword.length < 8
            }
            onClick={() =>
              changePasswordMutation.mutate({
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword,
                confirmPassword: passwordForm.confirmPassword,
              })
            }
          >
            {changePasswordMutation.isPending ? (
              <>
                Updating
                <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </div>
      </DashboardSection>
    </div>
  );
}

function Field({
  label,
  children,
  className,
  disabled = false,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={className}>
      <Label className={disabled ? "text-slate-400" : undefined}>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
