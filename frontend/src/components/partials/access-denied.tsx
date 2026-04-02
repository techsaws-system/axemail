"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

interface AccessDeniedProps {
  homePath: string;
}

function AccessDenied({ homePath }: AccessDeniedProps) {
  return (
    <main className="dashboard-layout-standard section-padding-standard min-h-[calc(100svh-90px)] flex items-center justify-center">
      <div className="max-w-xl w-full border-2 border-border bg-white p-10 text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-primary">
          Access Restricted
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-heading">
          Your role does not have access to this page.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Use a route allowed for your account, or sign in with a different role.
        </p>
        <Button asChild className="mt-8 rounded-none px-8 hover:bg-primary-hover">
          <Link href={homePath}>Go to allowed dashboard</Link>
        </Button>
      </div>
    </main>
  );
}

export default AccessDenied;
