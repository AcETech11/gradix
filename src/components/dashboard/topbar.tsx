"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bell, LogOut, Menu, Search, School } from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthProfile, AuthRole, AuthSchool } from "@/types/auth";

type TopbarProps = {
  school: AuthSchool | null;
  profile: AuthProfile;
  role: AuthRole;
  onMenuClick: () => void;
};

const notifications = [
  {
    title: "Result upload validated",
    description: "JSS 1A batch is ready for publishing.",
  },
  {
    title: "Parent access activity",
    description: "Three result codes were opened this morning.",
  },
  {
    title: "Onboarding progress",
    description: "Two remaining setup tasks are still pending.",
  },
];

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

export function Topbar({ school, profile, role, onMenuClick }: TopbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07111f]/90 backdrop-blur-xl">
      <div className="px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Button
            aria-label="Open navigation"
            className="border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 lg:hidden"
            onClick={onMenuClick}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Menu className="size-5" />
          </Button>

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-200">
              {school?.logo_url ? (
                <img alt="" className="size-full rounded-2xl object-cover" src={school.logo_url} />
              ) : (
                <School className="size-5" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-50">{school?.name ?? "Gradix"}</p>
              <p className="truncate text-xs text-slate-400">{school?.school_code ?? "Workspace"}</p>
            </div>
          </div>

          <div className="ml-auto hidden w-full max-w-xl lg:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <Input
                aria-label="Search dashboard"
                className="h-11 border-white/10 bg-slate-950/40 pl-9 text-slate-100 placeholder:text-slate-500"
                placeholder="Search students, classes, results..."
                type="search"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label="Notifications"
                className="relative border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                onClick={() => setOpen((value) => !value)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Bell className="size-5" />
                <span className="absolute right-2 top-2 size-2 rounded-full bg-orange-400" />
              </Button>

              <AnimatePresence>
                {open ? (
                  <motion.div
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute right-0 top-12 w-[20rem] overflow-hidden rounded-2xl border border-white/10 bg-[#08111f] p-2 shadow-2xl"
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    role="menu"
                    transition={{ duration: 0.18 }}
                  >
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold text-slate-50">Notifications</p>
                      <p className="text-xs text-slate-400">Preview data only for the dashboard shell.</p>
                    </div>
                    <div className="space-y-2 p-2">
                      {notifications.map((notification) => (
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3" key={notification.title}>
                          <p className="text-sm font-medium text-slate-50">{notification.title}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-400">{notification.description}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex size-9 items-center justify-center rounded-full bg-orange-500/15 text-xs font-semibold text-orange-200">
                {getInitials(profile.full_name || profile.email || "User")}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-50">{profile.full_name}</p>
                <p className="text-xs text-slate-400">{getRoleLabel(role)}</p>
              </div>
            </div>

            <form action={logoutAction}>
              <Button className="border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" type="submit" variant="ghost">
                <LogOut className="size-4" />
                Logout
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-3 lg:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <Input
              aria-label="Search dashboard"
              className="h-11 border-white/10 bg-slate-950/40 pl-9 text-slate-100 placeholder:text-slate-500"
              placeholder="Search students, classes, results..."
              type="search"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
