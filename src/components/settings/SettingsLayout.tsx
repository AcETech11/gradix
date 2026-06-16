import { BrandingSettings } from "@/components/settings/BrandingSettings";
import { GradingSystemSettings } from "@/components/settings/GradingSystemSettings";
import { ReportSettings } from "@/components/settings/ReportSettings";
import { SchoolProfileSettings } from "@/components/settings/SchoolProfileSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { SubjectImportSettings } from "@/components/settings/SubjectImportSettings";
import { UserManagementSettings } from "@/components/settings/UserManagementSettings";
import type { SchoolClassAssignment, SchoolInvitation, SchoolSettings, SchoolStaff, SchoolUser } from "@/lib/settings/settings-types";
import type { AuthProfile, AuthSchool } from "@/types/auth";

type SettingsLayoutProps = {
  settings: SchoolSettings;
  users: SchoolUser[];
  invitations: SchoolInvitation[];
  schoolStaff: SchoolStaff[];
  classAssignments: SchoolClassAssignment[];
  profile: AuthProfile;
  school: AuthSchool;
};

export function SettingsLayout({ settings, users, invitations, schoolStaff, classAssignments, profile, school }: SettingsLayoutProps) {
  const isAdmin = profile.role === "admin";
  const canEditReports = profile.role === "admin" || profile.role === "headmaster";

  return (
    <SettingsTabs
      sections={{
        profile: <SchoolProfileSettings canEdit={isAdmin} values={settings.profile} />,
        branding: <BrandingSettings canEdit={isAdmin} schoolId={settings.school.id} values={settings.branding} />,
        report: <ReportSettings canEdit={canEditReports} values={settings.reportSettings} />,
        grading: <GradingSystemSettings canEdit={isAdmin} values={settings.gradingScale} />,
        subjects: <SubjectImportSettings canManage={canEditReports} classes={classAssignments} />,
        users: <UserManagementSettings canManage={isAdmin} classAssignments={classAssignments} currentUserId={profile.id} invitations={invitations} schoolId={settings.school.id} schoolStaff={schoolStaff} users={users} />,
        security: <SecuritySettings profile={profile} school={school} />,
      }}
    />
  );
}
