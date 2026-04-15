"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

export function Progress({
  className,
  value,
  indicatorClassName,
}: {
  className?: string;
  value: number;
  indicatorClassName?: string;
}) {
  return (
    <ProgressPrimitive.Root
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200",
        className,
      )}
      value={value}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full rounded-full bg-blue-500 transition-transform duration-500",
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
