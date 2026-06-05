import { requireRole } from "@/lib/auth/session";
import { getCurrentAcademicYear } from "@/lib/onboarding/utils";
import { createClient } from "@/lib/supabase/server";
import type { UploadClassOption, UploadStudent, UploadSubject } from "@/lib/uploads/upload-types";
import type { SchoolTerm } from "@/types/database";

export async function getUploadPageData() {
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
  const [subjectsResult, studentsResult] =
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

  if (subjectsResult.error || studentsResult.error) {
    throw new Error(subjectsResult.error?.message ?? studentsResult.error?.message ?? "Upload data could not be loaded.");
  }

  const classOptions: UploadClassOption[] = (classes ?? []).map((schoolClass) => ({
    id: schoolClass.id,
    name: schoolClass.name,
    academicYear: schoolClass.academic_year,
    subjectCount: new Set((subjectsResult.data ?? []).filter((row) => row.class_id === schoolClass.id).map((row) => row.subject_id)).size,
    studentCount: (studentsResult.data ?? []).filter((row) => row.class_id === schoolClass.id).length,
  }));

  return {
    classes: classOptions,
    defaultAcademicYear: classOptions[0]?.academicYear ?? getCurrentAcademicYear(),
  };
}

export async function getUploadHistory() {
  const profile = await requireRole(["admin", "headmaster", "teacher"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("result_uploads")
    .select("id, class_id, term, academic_year, status, source_filename, total_rows, valid_rows, invalid_rows, created_at")
    .eq("school_id", profile.school_id)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    throw new Error(error.message);
  }

  const classIds = Array.from(new Set((data ?? []).map((upload) => upload.class_id)));
  const { data: classes } =
    classIds.length > 0
      ? await supabase.from("classes").select("id, name").eq("school_id", profile.school_id).in("id", classIds)
      : { data: [] };
  const classNames = new Map((classes ?? []).map((schoolClass) => [schoolClass.id, schoolClass.name]));

  return (data ?? []).map((upload) => ({
    ...upload,
    className: classNames.get(upload.class_id) ?? "Unknown class",
  }));
}

export async function getUploadDetail(uploadId: string) {
  const profile = await requireRole(["admin", "headmaster", "teacher"]);
  const supabase = await createClient();
  const { data: upload, error: uploadError } = await supabase
    .from("result_uploads")
    .select("*")
    .eq("id", uploadId)
    .eq("school_id", profile.school_id)
    .maybeSingle();

  if (uploadError || !upload) {
    throw new Error(uploadError?.message ?? "Upload was not found.");
  }

  const [{ data: schoolClass }, { data: results, error: resultsError }] = await Promise.all([
    supabase.from("classes").select("name").eq("id", upload.class_id).eq("school_id", profile.school_id).maybeSingle(),
    supabase
      .from("results")
      .select("id, student_id, subject_id, continuous_assessment, exam_score, total_score, grade, remark, is_published")
      .eq("school_id", profile.school_id)
      .eq("upload_id", upload.id)
      .order("created_at", { ascending: true }),
  ]);

  if (resultsError) {
    throw new Error(resultsError.message);
  }

  return {
    upload,
    className: schoolClass?.name ?? "Unknown class",
    results: results ?? [],
  };
}

export async function getValidationContext(classId: string, term: SchoolTerm, academicYear: string) {
  const profile = await requireRole(["admin", "headmaster", "teacher"]);
  const supabase = await createClient();
  const { data: schoolClass, error: classError } = await supabase
    .from("classes")
    .select("id, name, teacher_id")
    .eq("id", classId)
    .eq("school_id", profile.school_id)
    .eq("is_active", true)
    .maybeSingle();

  if (classError || !schoolClass) {
    throw new Error("The selected class was not found for your school.");
  }

  if (profile.role === "teacher" && schoolClass.teacher_id && schoolClass.teacher_id !== profile.id) {
    throw new Error("You are not allowed to upload results for this class.");
  }

  const { data: assignments, error: assignmentError } = await supabase
    .from("class_subjects")
    .select("subject_id")
    .eq("school_id", profile.school_id)
    .eq("class_id", classId)
    .eq("is_active", true);

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const subjectIds = Array.from(new Set((assignments ?? []).map((assignment) => assignment.subject_id).filter(Boolean)));

  if (subjectIds.length === 0) {
    throw new Error("This class has no subjects assigned. Assign subjects before uploading results.");
  }

  const [{ data: subjects, error: subjectsError }, { data: students, error: studentsError }] = await Promise.all([
    supabase.from("subjects").select("id, name, code").eq("school_id", profile.school_id).eq("is_active", true).in("id", subjectIds),
    supabase
      .from("students")
      .select("id, permanent_code, admission_number, first_name, middle_name, last_name")
      .eq("school_id", profile.school_id)
      .eq("class_id", classId)
      .eq("is_active", true),
  ]);

  if (subjectsError || studentsError) {
    throw new Error(subjectsError?.message ?? studentsError?.message ?? "Class roster could not be loaded.");
  }

  if (!students?.length) {
    throw new Error("This class has no students. Add students before uploading results.");
  }

  const { data: existingResults, error: existingError } = await supabase
    .from("results")
    .select("student_id, subject_id")
    .eq("school_id", profile.school_id)
    .eq("class_id", classId)
    .eq("term", term)
    .eq("academic_year", academicYear);

  if (existingError) {
    throw new Error(existingError.message);
  }

  return {
    profile,
    supabase,
    schoolClass,
    subjects: (subjects ?? []) satisfies UploadSubject[],
    students: (students ?? []).map((student) => ({
      id: student.id,
      permanentCode: student.permanent_code,
      admissionNumber: student.admission_number,
      name: [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" "),
    })) satisfies UploadStudent[],
    existingResults: existingResults ?? [],
  };
}
