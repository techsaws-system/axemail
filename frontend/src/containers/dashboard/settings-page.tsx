"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { apiRequest } from "@/utils/api-request";
import { Spinner } from "@/components/ui/spinner";
import type { CurrentUser } from "@/lib/authorization";

function SettingsPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiRequest("/users/me");
        setUser(data.data);
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleUpdate = async () => {
    if (!user) return;

    try {
      setLoading(true);

      await apiRequest("/users/me", {
        method: "PUT",
        body: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName,
          pseudoName: user.pseudoName,
        }),
      });

      toast.success("Profile updated successfully");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
      });

      toast.success("Logged out");
      window.location.href = "/";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    } catch (err: any) {
      toast.error("Logout failed");
    }
  };

  if (initialLoading) {
    return (
      <main className="dashboard-layout-standard section-padding-standard w-full h-[calc(100svh-90px)] flex-center">
        <Spinner className="h-[40px] w-[40px] text-primary" />
      </main>
    );
  }

  return (
    <main className="dashboard-layout-standard section-padding-standard">
      <h1 className="text-3xl text-heading font-semibold">
        Settings
      </h1>

      <div className="w-full mt-4 mb-8 h-[2px] rounded-full bg-border" />

      <div className="flex flex-col w-full gap-8">
        <div className="grid lg:grid-cols-2 gap-x-4 gap-y-8">
          <div className="flex flex-col gap-2 w-full">
            <Label className="font-medium text-heading">
              First Name
            </Label>
            <Input
              className="h-[50px] border-border rounded-none bg-white"
              value={user?.firstName || ""}
              onChange={(e) =>
                setUser((prev) =>
                  prev ? { ...prev, firstName: e.target.value } : prev,
                )
              }
            />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <Label className="font-medium text-heading">
              Last Name
            </Label>
            <Input
              className="h-[50px] border-border rounded-none bg-white"
              value={user?.lastName || ""}
              onChange={(e) =>
                setUser((prev) =>
                  prev ? { ...prev, lastName: e.target.value } : prev,
                )
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Label className="font-medium text-heading">
            Pseudo Name
          </Label>
          <Input
            className="h-[50px] border-border rounded-none bg-white"
            value={user?.pseudoName || ""}
            onChange={(e) =>
              setUser((prev) =>
                prev ? { ...prev, pseudoName: e.target.value } : prev,
              )
            }
          />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Label className="font-medium text-heading">
            Email (readonly)
          </Label>
          <Input
            className="h-[50px] border-border rounded-none bg-white"
            value={user?.email || ""}
            disabled
          />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Label className="font-medium text-heading">
            Role (readonly)
          </Label>
          <Input
            className="h-[50px] border-border rounded-none bg-white uppercase"
            value={user?.role || ""}
            disabled
          />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Label className="font-medium text-heading">
            Daily Sending Limit (readonly)
          </Label>
          <Input
            className="h-[50px] border-border rounded-none bg-white"
            value={user?.dailySendLimit ?? 0}
            disabled
          />
        </div>

        <div className="flex items-center justify-between max-md:flex-col gap-2">
          <Button
            onClick={handleUpdate}
            disabled={loading}
            className="h-[45px] max-md:w-full rounded-none hover:bg-primary-hover"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>

          <Button
            onClick={handleLogout}
            className="bg-destructive max-md:w-full rounded-none h-[45px] px-8 hover:bg-red-500"
          >
            Log out
          </Button>
        </div>
      </div>
    </main>
  );
}

export default SettingsPage;
