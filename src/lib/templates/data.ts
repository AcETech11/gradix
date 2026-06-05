import { requireRole } from "@/lib/auth/session";
import { getCurrentAcademicYear } from "@/lib/onboarding/utils";
import { createClient } from "@/lib/supabase/server";
import type { TemplateClassOption } from "@/lib/templates/template-types";

export async function getTemplatePageData() {
  const profile = await requireRole(["admin", "headmaster", "teacher"]);
  const supabase = await createClient();
  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, name, academic_year, teacher_id")
    .eq("school_id", profile.school_id)
    .eq("is_active", true)
    .order("name");

  if (classesError) {
    throw new Error(classesError.message);
  }

  const classIds = (classes ?? []).map((schoolClass) => schoolClass.id);
  const [{ data: assignments, error: assignmentsError }, { data: students, error: studentsError }] =
    classIds.length > 0
      ? await Promise.all([
          supabase
            .from("class_subjects")
            .select("class_id, subject_id")
            .eq("school_id", profile.school_id)
            .eq("is_active", true)
            .in("class_id", classIds),
          supabase
            .from("students")
            .select("class_id")
            .eq("school_id", profile.school_id)
            .eq("is_active", true)
            .in("class_id", classIds),
        ])
      : [
          { data: [], error: null },
          { data: [], error: null },
        ];

  if (assignmentsError || studentsError) {
    throw new Error(assignmentsError?.message ?? studentsError?.message ?? "Template page data could not be loaded.");
  }

  const classOptions: TemplateClassOption[] = (classes ?? []).map((schoolClass) => ({
    id: schoolClass.id,
    name: schoolClass.name,
    academicYear: schoolClass.academic_year,
    teacherId: schoolClass.teacher_id,
    subjectCount: new Set((assignments ?? []).filter((assignment) => assignment.class_id === schoolClass.id).map((assignment) => assignment.subject_id)).size,
    studentCount: (students ?? []).filter((student) => student.class_id === schoolClass.id).length,
  }));

  return {
    classes: classOptions,
    defaultAcademicYear: classOptions[0]?.academicYear ?? getCurrentAcademicYear(),
  };
}
