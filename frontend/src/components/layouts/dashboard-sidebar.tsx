"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { DashboardSidebarNavLinks } from "@/data/components.layout-data";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "../../components/ui/sidebar";

import { cn } from "@/lib/utils";

import Logo from "../../../public/favicons/logo.png";

function DashboardSidebar({ ...props }) {
  const pathname = usePathname();

  return (
    <Sidebar {...props} className="border-sidebar-border">
      <SidebarHeader className="px-4 py-2 border-b-2 border-sidebar-border flex items-center flex-row gap-2">
        <Image src={Logo} alt="Axemail" className="w-[60px] h-auto" />
        <h2 className="text-3xl font-medium text-heading">Axemail</h2>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="py-4 gap-4">
              {DashboardSidebarNavLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.path}
                        className={cn(
                          "flex items-center gap-3 px-4 py-6 rounded-sm transition-colors !font-medium",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "hover:bg-primary text-heading hover:text-primary-foreground",
                        )}
                      >
                        <Icon size={18} />
                        <span className="text-base">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}

export default DashboardSidebar;
