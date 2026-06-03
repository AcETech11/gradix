import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { getRoleHomePath, isDashboardRole } from "@/lib/auth/permissions";
import { getStringMetadata } from "@/lib/onboarding/utils";
import { createClient } from "@/lib/supabase/server";
import type { AcademicStructureInput, BrandingInput, SchoolInformationInput, SubjectsAssignmentsInput } from "@/lib/onboarding/schema";
import type { OnboardingInitialData } from "@/types/onboarding";

export const metadata: Metadata = {
  title: "Onboarding",
};

export default async function OnboardingPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login?next=/onboarding");
  }

  if (!isDashboardRole(profile.role) || !["admin", "headmaster"].includes(profile.role)) {
    const fallbackPath = isDashboardRole(profile.role) ? getRoleHomePath(profile.role) : "/dashboard";
    redirect(fallbackPath);
  }

  const supabase = await createClient();
  const { data: school } = await supabase.from("schools").select("*").eq("id", profile.school_id).single();

  if (!school) {
    redirect("/dashboard");
  }

  const [{ data: teachers }, { data: classes }, { data: subjects }, { data: assignments }] = await Promise.all([
    supabase.from("users").select("id, full_name").eq("school_id", profile.school_id).eq("role", "teacher").eq("is_active", true),
    supabase.from("classes").select("id, name, teacher_id").eq("school_id", profile.school_id).eq("is_active", true).order("name"),
    supabase.from("subjects").select("id, name, code").eq("school_id", profile.school_id).eq("is_active", true).order("name"),
    supabase.from("class_subjects").select("class_id, subject_id").eq("school_id", profile.school_id).eq("is_active", true),
  ]);

  const subjectRows = subjects ?? [];
  const assignmentRows = assignments ?? [];

  const initialData: OnboardingInitialData = {
    profile,
    school,
    teachers: (teachers ?? []).map((teacher) => ({
      id: teacher.id,
      fullName: teacher.full_name,
    })),
    classes: (classes ?? []).map((schoolClass) => ({
      id: schoolClass.id,
      name: schoolClass.name,
      teacherId: schoolClass.teacher_id,
    })),
    subjects: subjectRows.map((subject) => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      classIds: assignmentRows.filter((row) => row.subject_id === subject.id).map((row) => row.class_id),
    })),
  };

  const schoolInformation: SchoolInformationInput = {
    schoolName: school.name,
    schoolCode: school.school_code ?? getStringMetadata(school.metadata, "school_code", school.slug.toUpperCase()),
    schoolType: getStringMetadata(school.metadata, "school_type", ""),
    schoolAddress: school.address_line_1 ?? "",
    schoolPhone: school.phone ?? "",
    schoolEmail: school.email ?? "",
    principalName: getStringMetadata(school.metadata, "principal_name", ""),
    schoolMotto: school.motto ?? "",
  };

  const branding: BrandingInput = {
    logoUrl: school.logo_url ?? "",
    signatureUrl: school.headmaster_signature_url ?? "",
    primaryColor: getStringMetadata(school.metadata, "primary_color", "#0f172a"),
    secondaryColor: getStringMetadata(school.metadata, "secondary_color", "#f97316"),
  };

  const academicStructure: AcademicStructureInput = {
    classes: initialData.classes.length
      ? initialData.classes.map((row) => ({
          id: row.id,
          name: row.name,
          teacherId: row.teacherId,
        }))
      : [{ name: "", teacherId: null }],
  };

  const subjectAssignments: SubjectsAssignmentsInput = {
    subjects: initialData.subjects.length
      ? initialData.subjects.map((subject) => ({
          id: subject.id,
          name: subject.name,
          code: subject.code,
          classIds: subject.classIds,
        }))
      : [
          { name: "Mathematics", code: "MATH", classIds: initialData.classes.map((row) => row.id) },
          { name: "English", code: "ENG", classIds: initialData.classes.map((row) => row.id) },
        ],
  };

  return (
    <OnboardingLayout>
      <OnboardingFlow
        initialData={initialData}
        schoolInformation={schoolInformation}
        branding={branding}
        academicStructure={academicStructure}
        subjectAssignments={subjectAssignments}
      />
    </OnboardingLayout>
  );
}
