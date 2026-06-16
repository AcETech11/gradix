"use server";

import { requireCanManageResultOperations } from "@/lib/auth/authorization";
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

export async function generateResultTemplateAction(input: unknown): Promise<TemplateActionState> {
  const profile = await requireCanManageResultOperations();
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

  const subjectIds = Array.from(new Set((assignments ?? []).map((assignment) => assignment.subject_id).filter(Boolean)));

  if (subjectIds.length === 0) {
    return {
      ok: false,
      message: "This class has no subjects assigned. Assign subjects before downloading a result template.",
    };
  }

  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("id, name, code")
    .eq("school_id", profile.school_id)
    .eq("is_active", true)
    .in("id", subjectIds)
    .order("name");

  if (subjectsError) {
    return {
      ok: false,
      message: "We could not load subject details for this class.",
    };
  }

  if (!subjects?.length) {
    return {
      ok: false,
      message:
        "Subject assignments exist for this class, but the assigned subjects are inactive or missing. Re-save the Subjects & Class Assignments step.",
    };
  }

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, permanent_code, admission_number, first_name, middle_name, last_name, status, is_active")
    .eq("school_id", profile.school_id)
    .eq("class_id", parsed.data.classId)
    .eq("is_active", true)
    .in("status", ["active", "repeated"])
    .order("last_name")
    .order("first_name");

  if (studentsError) {
    return {
      ok: false,
      message: "We could not load students for this class.",
    };
  }

  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("student_class_enrollments")
    .select("student_id")
    .eq("school_id", profile.school_id)
    .eq("class_id", parsed.data.classId)
    .eq("academic_year", parsed.data.academicYear)
    .in("status", ["active", "repeated"]);

  if (enrollmentsError) {
    return {
      ok: false,
      message: "We could not load active enrollments for this class.",
    };
  }

  const enrolledStudentIds = new Set((enrollments ?? []).map((enrollment) => enrollment.student_id));
  const eligibleStudents = enrolledStudentIds.size > 0 ? (students ?? []).filter((student) => enrolledStudentIds.has(student.id)) : (students ?? []);

  if (!parsed.data.includeSampleRows && !eligibleStudents.length) {
    return {
      ok: false,
      message: "No students found in this class. Add students first or download a blank sample template.",
    };
  }

  const workbook = buildResultTemplateWorkbook({
    schoolName: school.name,
    className: schoolClass.name,
    term: parsed.data.term,
    academicYear: parsed.data.academicYear,
    includeSampleRows: parsed.data.includeSampleRows,
    subjects: subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
    })),
    students: eligibleStudents.map((student) => ({
      permanentCode: student.permanent_code,
      admissionNumber: student.admission_number ?? "",
      name: [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" "),
      className: schoolClass.name,
    })),
  });

  await supabase.from("audit_logs").insert({
    school_id: profile.school_id,
    actor_id: profile.id,
    actor_role: profile.role,
    action: "validate",
    table_name: "result_uploads",
    details: {
      security_event: "result_template_generated",
      class_id: schoolClass.id,
      class_name: schoolClass.name,
      term: parsed.data.term,
      academic_year: parsed.data.academicYear,
      subject_count: subjects.length,
          student_count: eligibleStudents.length,
    },
  });

  return {
    ok: true,
    message: "Template generated.",
    data: workbook,
  };
}
