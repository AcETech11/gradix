import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { getCurrentSchool, getCurrentUserProfile } from "@/lib/auth/session";
import { isDashboardRole } from "@/lib/auth/permissions";

export default async function DashboardRouteLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentUserProfile();

  if (!profile || !isDashboardRole(profile.role)) {
    redirect("/login?error=account");
  }

  const school = await getCurrentSchool();

  return <DashboardLayout profile={profile} school={school}>{children}</DashboardLayout>;
}
