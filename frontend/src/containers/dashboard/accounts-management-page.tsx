"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { apiRequest } from "@/utils/api-request";

interface ManageableUser {
  id: string;
  firstName: string;
  lastName: string;
  pseudoName?: string | null;
  email: string;
  role: "MANAGER" | "EMPLOYEE";
  dailySendLimit: number;
  isActive: boolean;
  managerId?: string | null;
  managerName?: string | null;
  isAllocatedByCurrentUser: boolean;
  sentToday: number;
  remainingToday: number;
}

interface ManageableAccountsResponse {
  allocator: {
    role: "ADMIN" | "MANAGER";
    allocatableLimit: number;
    allocatedLimit: number;
    remainingToAllocate: number;
  };
  users: ManageableUser[];
}

function AccountsManagementPage() {
  const [data, setData] = useState<ManageableAccountsResponse | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [dailySendLimit, setDailySendLimit] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await apiRequest("/users/manageable-accounts");
      const payload = response.data as ManageableAccountsResponse;
      setData(payload);

      if (payload.users.length === 0) {
        setSelectedUserId("");
        setDailySendLimit("");
        return;
      }

      if (!selectedUserId) {
        setSelectedUserId(payload.users[0].id);
        setDailySendLimit(String(payload.users[0].dailySendLimit));
        return;
      }

      const refreshedSelectedUser =
        payload.users.find((user) => user.id === selectedUserId) ?? payload.users[0];

      setSelectedUserId(refreshedSelectedUser.id);
      setDailySendLimit(String(refreshedSelectedUser.dailySendLimit));
    } catch {
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const selectedUser = useMemo(
    () => data?.users.find((user) => user.id === selectedUserId) ?? null,
    [data, selectedUserId],
  );

  const remainingAfterUpdate = useMemo(() => {
    if (!data || !selectedUser) {
      return data?.allocator.remainingToAllocate ?? 0;
    }

    const parsedLimit = Number(dailySendLimit);
    const nextLimit = Number.isFinite(parsedLimit) ? Math.max(parsedLimit, 0) : 0;
    const nextAllocated =
      data.allocator.allocatedLimit -
      (selectedUser.isAllocatedByCurrentUser ? selectedUser.dailySendLimit : 0) +
      nextLimit;

    return data.allocator.allocatableLimit - nextAllocated;
  }, [data, dailySendLimit, selectedUser]);

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    const nextUser = data?.users.find((user) => user.id === userId);
    setDailySendLimit(nextUser ? String(nextUser.dailySendLimit) : "");
  };

  const handleSave = async () => {
    if (!selectedUser) {
      toast.error("Select a user first");
      return;
    }

    const parsedLimit = Number(dailySendLimit);

    if (!Number.isInteger(parsedLimit) || parsedLimit < 0) {
      toast.error("Enter a valid non-negative limit");
      return;
    }

    try {
      setSaving(true);

      await apiRequest(`/users/${selectedUser.id}/quota`, {
        method: "PATCH",
        body: JSON.stringify({ dailySendLimit: parsedLimit }),
      });

      toast.success("Quota updated");
      await fetchAccounts();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update quota";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="dashboard-layout-standard section-padding-standard w-full h-[calc(100svh-90px)] flex-center">
        <Spinner className="h-[40px] w-[40px] text-primary" />
      </main>
    );
  }

  return (
    <main className="dashboard-layout-standard section-padding-standard">
      <h1 className="text-3xl text-heading font-semibold">Accounts Management</h1>
      <div className="w-full mt-4 mb-8 h-[2px] rounded-full bg-border" />

      <div className="grid xl:grid-cols-3 gap-4">
        <Card className="rounded-none border-border">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-heading">Allocation Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Allocatable Limit</p>
              <p className="text-3xl font-semibold text-heading">{data?.allocator.allocatableLimit ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Allocated</p>
              <p className="text-3xl font-semibold text-heading">{data?.allocator.allocatedLimit ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className={`text-3xl font-semibold ${remainingAfterUpdate < 0 ? "text-destructive" : "text-primary"}`}>
                {remainingAfterUpdate}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border xl:col-span-2">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-heading">Assign Daily Quota</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <Label className="font-medium text-heading">Select User</Label>
              <select
                value={selectedUserId}
                onChange={(e) => handleUserChange(e.target.value)}
                className="h-[50px] border border-border rounded-none bg-white px-3 text-sm outline-none focus:border-primary"
              >
                {data?.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="font-medium text-heading">Daily Limit</Label>
              <Input
                type="number"
                min={0}
                className="h-[50px] border-border rounded-none bg-white"
                value={dailySendLimit}
                onChange={(e) => setDailySendLimit(e.target.value)}
              />
            </div>

            <div className="md:col-span-2 grid md:grid-cols-3 gap-4">
              <div className="border border-border p-4">
                <p className="text-sm text-muted-foreground">Current Limit</p>
                <p className="mt-1 text-2xl font-semibold text-heading">{selectedUser?.dailySendLimit ?? 0}</p>
              </div>
              <div className="border border-border p-4">
                <p className="text-sm text-muted-foreground">Sent Today</p>
                <p className="mt-1 text-2xl font-semibold text-heading">{selectedUser?.sentToday ?? 0}</p>
              </div>
              <div className="border border-border p-4">
                <p className="text-sm text-muted-foreground">Manager</p>
                <p className="mt-1 text-base font-semibold text-heading">{selectedUser?.managerName ?? "Direct / Unassigned"}</p>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving || !selectedUser}
                className="rounded-none h-[45px] px-8 hover:bg-primary-hover"
              >
                {saving ? "Saving..." : "Update Quota"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-none border-border mt-8">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-heading">Tracked Accounts</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-4 pr-4 font-semibold text-heading">User</th>
                  <th className="py-4 pr-4 font-semibold text-heading">Role</th>
                  <th className="py-4 pr-4 font-semibold text-heading">Manager</th>
                  <th className="py-4 pr-4 font-semibold text-heading">Limit</th>
                  <th className="py-4 pr-4 font-semibold text-heading">Sent Today</th>
                  <th className="py-4 pr-4 font-semibold text-heading">Remaining</th>
                  <th className="py-4 pr-4 font-semibold text-heading">Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.users.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-b border-border/70 cursor-pointer ${selectedUserId === user.id ? "bg-primary/5" : ""}`}
                    onClick={() => handleUserChange(user.id)}
                  >
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-heading">{user.firstName} {user.lastName}</p>
                      <p className="text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="py-4 pr-4">{user.role}</td>
                    <td className="py-4 pr-4">{user.managerName ?? "Direct / Unassigned"}</td>
                    <td className="py-4 pr-4">{user.dailySendLimit}</td>
                    <td className="py-4 pr-4">{user.sentToday}</td>
                    <td className="py-4 pr-4">{user.remainingToday}</td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold uppercase ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default AccountsManagementPage;
