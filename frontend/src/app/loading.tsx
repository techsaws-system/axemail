import { LoaderCircle } from "lucide-react";

export default function RootLoading() {
  return (
    <main className="relative flex h-svh w-full items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_42%,#e2e8f0_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.10),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_22%),radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.92),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22180%22 height=%22180%22 viewBox=%220 0 180 180%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.78%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22180%22 height=%22180%22 filter=%22url(%23n)%22 opacity=%220.9%22/%3E%3C/svg%3E')]" />
      <LoaderCircle
        strokeWidth={4}
        className="relative h-12 w-12 animate-spin text-black"
      />
    </main>
  );
}
