import { redirect } from "next/navigation";

import { getSchoolSettingsAction } from "@/actions/settings/get-school-settings-action";
import { getSchoolStaffAction } from "@/actions/settings/get-school-staff-action";
import { getSchoolUsersAction } from "@/actions/settings/get-school-users-action";
import { getStaffInvitationsAction } from "@/actions/settings/get-staff-invitations-action";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { getCurrentSchool, getCurrentUserProfile } from "@/lib/auth/session";

export default async function SettingsPage() {
  const [profile, school] = await Promise.all([getCurrentUserProfile(), getCurrentSchool()]);

  if (!profile || !school) {
    redirect("/login");
  }

  if (profile.role !== "admin" && profile.role !== "headmaster") {
    redirect("/dashboard");
  }

  const [settings, users, invitations, staffData] = await Promise.all([getSchoolSettingsAction(), getSchoolUsersAction(), getStaffInvitationsAction(), getSchoolStaffAction()]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Workspace settings and customization"
        description="Customize school profile, branding, report appearance, grading rules, staff access, and account security."
      />
      <SettingsLayout classAssignments={staffData.classes} invitations={invitations} profile={profile} school={school} schoolStaff={staffData.staff} settings={settings} users={users} />
    </div>
  );
}
