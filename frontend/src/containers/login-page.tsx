"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

import Logo from "../../public/favicons/logo.png";
import { apiRequest } from "@/utils/api-request";
import { getDefaultRouteForRole } from "@/lib/authorization";

function LoginPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    if (loading) return;

    if (!user || !pass) {
      toast.error("Username and password are required");
      return;
    }

    try {
      setLoading(true);

      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: user,
          password: pass,
        }),
      });

      toast.success("Login successful");
      window.location.href = getDefaultRouteForRole(response.data.user.role);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="w-full h-svh bg-background">
      <div className="layout-standard h-full flex-center flex-col">
        <Image src={Logo} alt="Axemail" priority className="h-auto w-[180px]" />

        <Card
          className="border-border max-w-[400px] w-full rounded-2xl"
          style={{ boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
        >
          <CardHeader className="text-center justify-center">
            <CardTitle className="text-3xl font-bold uppercase text-heading">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-heading capitalize font-medium">
              Enter your credentials to access Axemail
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-heading font-semibold uppercase"
                >
                  Email
                </Label>
                <Input
                  id="username"
                  placeholder="Enter your email"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                  className="h-[50px] rounded-none border-border bg-input"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-heading font-semibold uppercase"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  className="h-[50px] rounded-none border-border bg-input"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 !mt-10 rounded-none hover:bg-primary-hover"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Spinner />
                    Signing in
                  </span>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default LoginPage;
