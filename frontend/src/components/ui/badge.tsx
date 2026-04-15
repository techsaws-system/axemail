import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]",
  {
    variants: {
      variant: {
        neutral: "border-slate-200 bg-slate-100 text-slate-600",
        success: "border-emerald-200 bg-emerald-50 text-emerald-700",
        info: "border-sky-200 bg-sky-50 text-sky-700",
        warning: "border-amber-200 bg-amber-50 text-amber-700",
        danger: "border-rose-200 bg-rose-50 text-rose-700",
        inverse: "border-slate-900 bg-slate-900 text-white",
        subtle: "border-slate-200 bg-white text-slate-500",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export function Badge({
  children,
  className,
  variant,
}: {
  children: ReactNode;
  className?: string;
} & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)}>{children}</span>;
}
