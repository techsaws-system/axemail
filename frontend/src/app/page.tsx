"use client";

import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, LoaderCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import toast from "react-hot-toast";

import { APP_ROUTE } from "@/constants/enums";
import { loginRequest } from "@/lib/api";
import { persistSession } from "@/lib/api-request";
import { getUserErrorMessage } from "@/lib/error-message";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (session) => {
      persistSession(session);
      toast.success("Signed in successfully.");
      router.push(APP_ROUTE.OVERVIEW);
    },
    onError: (error) => {
      toast.error(getUserErrorMessage(error));
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hydrated || loginMutation.isPending || !email || !password) {
      return;
    }

    loginMutation.mutate({ email, password });
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_42%,#e2e8f0_100%)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.10),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_22%),radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.92),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22180%22 height=%22180%22 viewBox=%220 0 180 180%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.78%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22180%22 height=%22180%22 filter=%22url(%23n)%22 opacity=%220.9%22/%3E%3C/svg%3E')]" />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative p-12 overflow-hidden rounded-4xl border border-white/70 bg-white/60 shadow-[0_40px_120px_rgba(15,23,42,0.16)] backdrop-blur-3xl"
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.14] bg-[linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-size-[32px_32px]" />
        <div className="w-100 rounded-[1.9rem] border border-white/75 bg-white/78 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur-2xl">
          <div className="w-full flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Axemail"
              width={160}
              height={160}
              priority
            />
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label className="font-bold text-slate-800">Email</Label>
              <div className="mt-2">
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="font-bold text-slate-800">Password</Label>
              <div className="mt-2">
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </div>

            <motion.div
              whileHover={{ y: -1, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                type="submit"
                className="mt-3 cursor-pointer h-12 w-full rounded-2xl bg-slate-950 text-white shadow-[0_18px_35px_rgba(15,23,42,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_22px_45px_rgba(15,23,42,0.24)]"
                size="lg"
                disabled={
                  !hydrated || loginMutation.isPending || !email || !password
                }
              >
                {loginMutation.isPending ? (
                  <>
                    Logging In
                    <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Login
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
