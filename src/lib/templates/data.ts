import { requireCanManageResultOperations } from "@/lib/auth/authorization";
import { getCurrentAcademicYear } from "@/lib/onboarding/utils";
import { createClient } from "@/lib/supabase/server";
import type { TemplateClassOption } from "@/lib/templates/template-types";

type AssignmentPreviewRow = {
  class_id: string;
  subject_id: string;
};

export async function getTemplatePageData() {
  const profile = await requireCanManageResultOperations();
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
            .in("status", ["active", "repeated"])
            .in("class_id", classIds),
        ])
      : [
          { data: [], error: null },
          { data: [], error: null },
        ];

  if (assignmentsError || studentsError) {
    throw new Error(assignmentsError?.message ?? studentsError?.message ?? "Template page data could not be loaded.");
  }

  const assignmentRows = (assignments ?? []) as unknown as AssignmentPreviewRow[];
  const subjectIds = Array.from(new Set(assignmentRows.map((assignment) => assignment.subject_id).filter(Boolean)));
  const { data: subjects, error: subjectsError } =
    subjectIds.length > 0
      ? await supabase
          .from("subjects")
          .select("id, name")
          .eq("school_id", profile.school_id)
          .eq("is_active", true)
          .in("id", subjectIds)
      : { data: [], error: null };

  if (subjectsError) {
    throw new Error(subjectsError.message);
  }

  const subjectNamesById = new Map((subjects ?? []).map((subject) => [subject.id, subject.name]));
  const usableAssignments = assignmentRows.filter((assignment) => subjectNamesById.has(assignment.subject_id));
  const classOptions: TemplateClassOption[] = (classes ?? []).map((schoolClass) => ({
    ...buildTemplateClassOption({
      schoolClass,
      assignments: usableAssignments,
      students: students ?? [],
      subjectNamesById,
    }),
  }));

  return {
    classes: classOptions,
    defaultAcademicYear: classOptions[0]?.academicYear ?? getCurrentAcademicYear(),
  };
}

function buildTemplateClassOption({
  schoolClass,
  assignments,
  students,
  subjectNamesById,
}: {
  schoolClass: {
    id: string;
    name: string;
    academic_year: string;
    teacher_id: string | null;
  };
  assignments: AssignmentPreviewRow[];
  students: { class_id: string | null }[];
  subjectNamesById: Map<string, string>;
}): TemplateClassOption {
  const subjectNames = Array.from(
    new Set(
      assignments
        .filter((assignment) => assignment.class_id === schoolClass.id)
        .map((assignment) => subjectNamesById.get(assignment.subject_id))
        .filter((name): name is string => Boolean(name)),
    ),
  ).sort((first, second) => first.localeCompare(second));

  return {
    id: schoolClass.id,
    name: schoolClass.name,
    academicYear: schoolClass.academic_year,
    teacherId: schoolClass.teacher_id,
    subjectCount: subjectNames.length,
    subjectNames,
    studentCount: students.filter((student) => student.class_id === schoolClass.id).length,
  };
}
