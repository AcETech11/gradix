"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import type { AuthProfile, AuthSchool } from "@/types/auth";
import type { AuthRole } from "@/types/auth";

import { Breadcrumbs } from "./breadcrumbs";
import { MobileNavigation } from "./mobile-navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

type DashboardLayoutProps = {
  children: ReactNode;
  profile: AuthProfile;
  school: AuthSchool | null;
};

export function DashboardLayout({ children, profile, school }: DashboardLayoutProps) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const role = profile.role as AuthRole;

  return (
    <div className="min-h-dvh bg-[#050b16] text-slate-100">
      <MobileNavigation open={mobileNavigationOpen} onOpenChange={setMobileNavigationOpen} profile={profile} role={role} school={school} />
      <div className="flex min-h-dvh overflow-hidden">
        <Sidebar profile={profile} role={role} school={school} />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar onMenuClick={() => setMobileNavigationOpen(true)} profile={profile} role={role} school={school} />

          <main className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
              <Breadcrumbs />
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
