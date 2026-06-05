"use server";

import { requireRole } from "@/lib/auth/session";
import { buildResultTemplateWorkbook } from "@/lib/templates/build-result-template";
import { resultTemplateSchema, type GeneratedTemplateFile } from "@/lib/templates/template-types";
import { createClient } from "@/lib/supabase/server";

type TemplateActionState =
  | {
      ok: true;
      message: string;
      data: GeneratedTemplateFile;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

function validationErrorState(fieldErrors?: Record<string, string[] | undefined>): TemplateActionState {
  return {
    ok: false,
    message: "Check the template options and try again.",
    fieldErrors,
  };
}

function canDownloadClassTemplate(profile: Awaited<ReturnType<typeof requireRole>>, classTeacherId: string | null) {
  if (profile.role === "admin" || profile.role === "headmaster") {
    return true;
  }

  if (profile.role === "teacher") {
    return !classTeacherId || classTeacherId === profile.id;
  }

  return false;
}

export async function generateResultTemplateAction(input: unknown): Promise<TemplateActionState> {
  const profile = await requireRole(["admin", "headmaster", "teacher"]);
  const parsed = resultTemplateSchema.safeParse(input);

  if (!parsed.success) {
    return validationErrorState(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .select("name")
    .eq("id", profile.school_id)
    .maybeSingle();

  if (schoolError || !school) {
    return {
      ok: false,
      message: "Your school profile was not found.",
    };
  }

  const { data: schoolClass, error: classError } = await supabase
    .from("classes")
    .select("id, name, teacher_id")
    .eq("id", parsed.data.classId)
    .eq("school_id", profile.school_id)
    .maybeSingle();

  if (classError || !schoolClass) {
    return {
      ok: false,
      message: "The selected class was not found for your school.",
    };
  }

  if (!canDownloadClassTemplate(profile, schoolClass.teacher_id)) {
    return {
      ok: false,
      message: "You are not allowed to download a template for this class.",
    };
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from("class_subjects")
    .select("subject_id")
    .eq("school_id", profile.school_id)
    .eq("class_id", parsed.data.classId)
    .eq("is_active", true);

  if (assignmentsError) {
    return {
      ok: false,
      message: "We could not load subjects for this class.",
    };
  }

  const subjectIds = [...new Set((assignments ?? []).map((assignment) => assignment.subject_id))];
  const { data: subjects, error: subjectsError } =
    subjectIds.length > 0
      ? await supabase
          .from("subjects")
          .select("id, name, code")
          .eq("school_id", profile.school_id)
          .eq("is_active", true)
          .in("id", subjectIds)
          .order("name")
      : { data: [], error: null };

  if (subjectsError) {
    return {
      ok: false,
      message: "We could not load subjects for this class.",
    };
  }

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("permanent_code, admission_number, first_name, middle_name, last_name")
    .eq("school_id", profile.school_id)
    .eq("class_id", parsed.data.classId)
    .eq("is_active", true)
    .order("last_name")
    .order("first_name");

  if (studentsError) {
    return {
      ok: false,
      message: "We could not load students for this class.",
    };
  }

  const workbook = buildResultTemplateWorkbook({
    schoolName: school.name,
    className: schoolClass.name,
    term: parsed.data.term,
    academicYear: parsed.data.academicYear,
    subjects: (subjects ?? []).map((subject) => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
    })),
    students: (students ?? []).map((student) => ({
      permanentCode: student.permanent_code,
      admissionNumber: student.admission_number ?? "",
      name: [student.last_name, student.first_name, student.middle_name].filter(Boolean).join(" "),
      className: schoolClass.name,
    })),
  });

  return {
    ok: true,
    message: "Template generated.",
    data: workbook,
  };
}
