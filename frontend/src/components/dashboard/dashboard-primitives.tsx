import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DashboardSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="dashboard-section">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-900 md:text-xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  detail,
  accentClassName,
}: {
  label: string;
  value: string;
  detail: string;
  accentClassName?: string;
}) {
  return (
    <div
      className={cn(
        "dashboard-card dashboard-card-light border-slate-200/80",
        accentClassName,
      )}
    >
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
        {label}
      </p>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="dashboard-card dashboard-card-dark flex min-h-[280px] items-center justify-center">
      <div className="max-w-md text-center">
        <p className="text-lg font-semibold tracking-[-0.03em] text-slate-900">
          {title}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export function AccessRestricted({
  title = "Access restricted",
  description = "This surface is available only to roles with elevated permissions.",
}: {
  title?: string;
  description?: string;
}) {
  return <EmptyState title={title} description={description} />;
}

export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="dashboard-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="dashboard-card">
            <Skeleton className="h-3 w-24 bg-slate-200" />
            <Skeleton className="mt-4 h-10 w-28 bg-slate-200" />
            <Skeleton className="mt-3 h-3 w-36 bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="dashboard-card dashboard-card-dark">
          <Skeleton className="h-4 w-40 bg-slate-200" />
          <Skeleton className="mt-6 h-[280px] w-full bg-slate-200" />
        </div>
        <div className="dashboard-card dashboard-card-dark">
          <Skeleton className="h-4 w-32 bg-slate-200" />
          <Skeleton className="mt-6 h-[280px] w-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export function DataTable({
  headers,
  children,
  className,
}: {
  headers: string[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("dashboard-card overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="border-b border-slate-200">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}
