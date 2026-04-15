"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { createContext, useContext, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("Sidebar components must be used within SidebarProvider.");
  }
  return context;
}

export function SidebarProvider({
  children,
  open,
  setOpen,
}: {
  children: ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return <SidebarContext.Provider value={{ open, setOpen }}>{children}</SidebarContext.Provider>;
}

export function Sidebar({ children, className }: { children: ReactNode; className?: string }) {
  const { open } = useSidebar();

  return (
    <aside
      className={cn(
        "dashboard-sidebar fixed inset-y-4 left-4 z-40 w-[292px] text-slate-900 transition md:static md:inset-auto",
        open ? "translate-x-0" : "-translate-x-[120%] md:translate-x-0",
        className,
      )}
    >
      {children}
    </aside>
  );
}

export function SidebarContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex h-full flex-col gap-8", className)}>{children}</div>;
}

export function SidebarGroup({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function SidebarGroupLabel({ children }: { children: ReactNode }) {
  return <p className="mb-3 px-2 text-[11px] uppercase tracking-[0.28em] text-slate-400">{children}</p>;
}

export function SidebarGroupContent({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

export function SidebarMenu({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

export function SidebarMenuItem({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function SidebarMenuButton({
  children,
  isActive,
  className,
}: {
  children: ReactNode;
  isActive?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition",
        isActive
          ? "border-slate-900 bg-slate-900 text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)]"
          : "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SidebarInset({ children }: { children: ReactNode }) {
  return <div className="min-w-0 flex-1">{children}</div>;
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { open, setOpen } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("md:hidden", className)}
      onClick={() => setOpen(!open)}
    >
      {open ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
    </Button>
  );
}
