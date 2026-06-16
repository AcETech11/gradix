"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, LogOut, School } from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AuthProfile, AuthSchool, AuthRole } from "@/types/auth";

import { getVisibleDashboardNavItems } from "./navigation";

type MobileNavigationProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function MobileNavigation({ open, onOpenChange, role, school, profile }: MobileNavigationProps) {
  const items = getVisibleDashboardNavItems(role);
  const pathname = usePathname();

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    if (open) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
            type="button"
          />
          <motion.aside
            animate={{ x: 0 }}
            className="absolute left-0 top-0 flex h-full w-[88vw] max-w-[20rem] flex-col border-r border-white/10 bg-[#08111f] text-slate-100 shadow-2xl"
            exit={{ x: "-100%" }}
            initial={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-200">
                  {school?.logo_url ? (
                    <img alt="" className="size-full rounded-2xl object-cover" src={school.logo_url} />
                  ) : (
                    <School className="size-5" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-50">{school?.name ?? "Gradix"}</p>
                  <p className="text-xs text-slate-400">{school?.school_code ?? "Workspace"}</p>
                </div>
              </div>
              <Button aria-label="Close navigation" size="icon" type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                <ChevronLeft />
              </Button>
            </div>

            <nav className="dashboard-sidebar-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-orange-500/12 text-orange-200 ring-1 ring-orange-400/15"
                        : "text-slate-300 hover:bg-white/5 hover:text-slate-50",
                    )}
                    href={item.href}
                    key={item.href}
                    onClick={() => onOpenChange(false)}
                  >
                    <item.icon
                      className={cn("size-5 shrink-0", isActive ? "text-orange-200" : "text-slate-400")}
                      aria-hidden="true"
                    />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-white/10 px-4 py-4">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-orange-500/15 text-sm font-semibold text-orange-200">
                  {getInitials(profile.full_name || profile.email || "U")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-50">{profile.full_name}</p>
                  <p className="text-xs text-slate-400">{getRoleLabel(role)}</p>
                </div>
                <form action={logoutAction}>
                  <Button aria-label="Logout" size="icon" type="submit" variant="ghost">
                    <LogOut />
                  </Button>
                </form>
              </div>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
