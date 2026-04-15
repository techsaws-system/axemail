"use client";

import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  dashboardNavigation,
  dashboardPageTitles,
} from "@/constants/dashboard-navigation";
import { APP_ROUTE } from "@/constants/enums";
import { logoutRequest } from "@/lib/api";
import { clearAuthSession } from "@/lib/api-request";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSidebarOpen } from "@/store/ui-slice";
import Logo from "../../../public/logo.svg";
import { LoaderCircle } from "lucide-react";

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const activeUser = useAppSelector((state) => state.auth.user);
  const refreshToken = useAppSelector((state) => state.auth.refreshToken);
  const current =
    dashboardPageTitles[pathname] ?? dashboardPageTitles[APP_ROUTE.OVERVIEW];
  const role = activeUser?.role;

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await logoutRequest(refreshToken);
      }
    },
    onSettled: () => {
      clearAuthSession();
      router.push(APP_ROUTE.LOGIN);
    },
  });

  if (!hydrated || !activeUser || !role) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_22%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.22] bg-[linear-gradient(rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.10)_1px,transparent_1px)] bg-size-[32px_32px]" />
      <SidebarProvider
        open={sidebarOpen}
        setOpen={(open) => dispatch(setSidebarOpen(open))}
      >
        <div className="relative mx-auto flex min-h-screen max-w-445 gap-6 p-4 md:p-6">
          <Sidebar>
            <SidebarContent>
              <div className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                  <Image src={Logo} alt="Axemail Logo" className="h-auto w-8" />
                </div>
                <div>
                  <p className="text-sm font-bold tracking-[0.16em] text-slate-900">
                    AXEMAIL
                  </p>
                  <p className="text-xs text-slate-500">Email operations</p>
                </div>
              </div>

              <nav className="space-y-8">
                {dashboardNavigation.map((section) => {
                  const items = section.items.filter(
                    (item) => !item.roles || item.roles.includes(role),
                  );

                  if (!items.length) {
                    return null;
                  }

                  return (
                    <SidebarGroup key={section.categoryTitle}>
                      <SidebarGroupLabel>
                        {section.categoryTitle}
                      </SidebarGroupLabel>
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {items.map((item) => {
                            const Icon = item.icon;
                            const active = pathname === item.href;

                            return (
                              <SidebarMenuItem key={item.href}>
                                <Link
                                  href={item.href}
                                  onClick={() =>
                                    dispatch(setSidebarOpen(false))
                                  }
                                >
                                  <SidebarMenuButton isActive={active}>
                                    <Icon className="h-4 w-4" />
                                    <span>{item.title}</span>
                                  </SidebarMenuButton>
                                </Link>
                              </SidebarMenuItem>
                            );
                          })}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>
                  );
                })}
              </nav>
            </SidebarContent>
          </Sidebar>

          <SidebarInset>
            <header className="dashboard-header mb-6">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex items-start gap-3">
                  <SidebarTrigger />
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge variant="inverse">{role}</Badge>
                      <Badge variant="success">{activeUser.status}</Badge>
                    </div>
                    <h1 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950 md:text-5xl">
                      {current.title}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                      {current.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 xl:items-end">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                      <Avatar>
                        <AvatarFallback className="border-slate-200 bg-slate-900 text-white">
                          {activeUser.firstName[0]}
                          {activeUser.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {activeUser.firstName} {activeUser.lastName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {activeUser.email}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="danger"
                      className="font-semibold cursor-pointer"
                      onClick={() => logoutMutation.mutate()}
                    >
                      {logoutMutation.isPending ? (
                        <>
                          Logging out
                          <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                        </>
                      ) : (
                        "Logout"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </header>

            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {children}
            </motion.main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
