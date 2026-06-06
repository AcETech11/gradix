import { redirect } from "next/navigation";

import { getSchoolSettingsAction } from "@/actions/settings/get-school-settings-action";
import { getSchoolUsersAction } from "@/actions/settings/get-school-users-action";
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

  const [settings, users] = await Promise.all([getSchoolSettingsAction(), getSchoolUsersAction()]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Workspace settings and customization"
        description="Customize school profile, branding, report appearance, grading rules, staff access, and account security."
      />
      <SettingsLayout profile={profile} school={school} settings={settings} users={users} />
    </div>
  );
}
