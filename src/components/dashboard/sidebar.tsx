"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, School } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InstallGradixButton } from "@/components/pwa/install-gradix-button";
import { cn } from "@/lib/utils";
import type { AuthProfile, AuthRole, AuthSchool } from "@/types/auth";

import { getVisibleDashboardNavItems } from "./navigation";

type SidebarProps = {
  role: AuthRole;
  school: AuthSchool | null;
  profile: AuthProfile;
};

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getRoleLabel(role: AuthRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function Sidebar({ role, school, profile }: SidebarProps) {
  const pathname = usePathname();
  const items = useMemo(() => getVisibleDashboardNavItems(role), [role]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // The first client render must match SSR; stored preferences are applied after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(window.localStorage.getItem("gradix-dashboard-sidebar-collapsed") === "true");
  }, []);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem("gradix-dashboard-sidebar-collapsed", String(next));
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "dashboard-print-hidden sticky top-0 hidden h-dvh shrink-0 border-r border-white/10 bg-[#08111f] text-slate-100 transition-all duration-300 lg:flex lg:flex-col",
        collapsed ? "w-[5.75rem]" : "w-[18.5rem]",
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
        <Link className={cn("flex min-w-0 items-center gap-3", collapsed && "justify-center")} href="/dashboard">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-200">
            {school?.logo_url ? (
              <img alt="" className="size-full rounded-2xl object-cover" src={school.logo_url} />
            ) : (
              <School className="size-5" aria-hidden="true" />
            )}
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-50">{school?.name ?? "Gradix"}</p>
              <p className="truncate text-xs text-slate-400">{school?.school_code ?? "School workspace"}</p>
            </div>
          ) : null}
        </Link>
        <Button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="shrink-0 border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
          onClick={toggleCollapsed}
          size="icon"
          type="button"
          variant="ghost"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
      </div>

      <nav className="dashboard-sidebar-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const isActive =
            item.href === "/dashboard" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0" : "justify-start",
                isActive
                  ? "bg-orange-500/12 text-orange-200 ring-1 ring-orange-400/15"
                  : "text-slate-300 hover:bg-white/5 hover:text-slate-50",
              )}
              href={item.href}
              key={item.href}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className={cn("size-5 shrink-0", isActive ? "text-orange-200" : "text-slate-400")} aria-hidden="true" />
              {!collapsed ? <span className="truncate">{item.title}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-white/10 p-4">
        <InstallGradixButton collapsed={collapsed} />
        <div
          className={cn(
            "rounded-2xl border border-white/10 bg-white/5 p-3",
            collapsed ? "flex flex-col items-center gap-3" : "flex items-center gap-3",
          )}
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-sm font-semibold text-orange-200">
            {getInitials(profile.full_name || profile.email || "User")}
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-50">{profile.full_name}</p>
              <p className="text-xs text-slate-400">{getRoleLabel(role)}</p>
            </div>
          ) : (
            <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-200">
              {getRoleLabel(role)}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
