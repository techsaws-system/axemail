import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { APP_ROUTE } from "@/constants/enums";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_42%,#e2e8f0_100%)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.10),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_22%),radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.92),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22180%22 height=%22180%22 viewBox=%220 0 180 180%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.78%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22180%22 height=%22180%22 filter=%22url(%23n)%22 opacity=%220.9%22/%3E%3C/svg%3E')]" />
      <div className="relative w-full max-w-107.5 rounded-[1.9rem] border border-white/75 bg-white/78 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur-2xl">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">404</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-slate-950">Page not found</h1>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          The requested page is not available in this workspace.
        </p>
        <Button
          className="mt-8 h-12 w-full rounded-2xl bg-slate-950 text-white shadow-[0_18px_35px_rgba(15,23,42,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_22px_45px_rgba(15,23,42,0.24)]"
          asChild
        >
          <Link href={APP_ROUTE.LOGIN}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back
          </Link>
        </Button>
      </div>
    </main>
  );
}
