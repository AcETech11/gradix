"use server";

import { revalidatePath } from "next/cache";

import { requireCanManageResultOperations } from "@/lib/auth/authorization";
import { classTermReportSettingsSchema, reportDetailsSchema, type ResultActionState } from "@/lib/results/result-types";
import { createClient } from "@/lib/supabase/server";

function cleanDate(value: string | null | undefined) {
  return value?.trim() || null;
}

export async function updateStudentReportDetailsAction(input: unknown): Promise<ResultActionState> {
  const profile = await requireCanManageResultOperations();
  const parsed = reportDetailsSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the report details.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: rows, error: rowsError } = await supabase
    .from("results")
    .select("id, class_id, term, academic_year, is_published")
    .eq("school_id", profile.school_id)
    .eq("upload_id", parsed.data.uploadId)
    .eq("student_id", parsed.data.studentId);

  if (rowsError || !rows?.length) {
    return { ok: false, message: rowsError?.message ?? "Result rows were not found for this student." };
  }

  const firstRow = rows[0];
  const hasPublishedRows = rows.some((row) => row.is_published);

  if (hasPublishedRows && !parsed.data.reasonForEdit?.trim()) {
    return { ok: false, message: "Provide a reason before changing published report details." };
  }

  const { error } = await supabase.from("student_term_reports").upsert(
    {
      school_id: profile.school_id,
      student_id: parsed.data.studentId,
      class_id: firstRow.class_id,
      academic_year: firstRow.academic_year,
      term: firstRow.term,
      upload_id: parsed.data.uploadId,
      attendance_present: parsed.data.attendancePresent ?? null,
      attendance_absent: parsed.data.attendanceAbsent ?? null,
      affective_domain: parsed.data.affectiveDomain,
      psychomotor_domain: parsed.data.psychomotorDomain,
      class_teacher_comment: parsed.data.classTeacherComment?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "school_id,student_id,class_id,academic_year,term,upload_id" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  await supabase.from("audit_logs").insert({
    school_id: profile.school_id,
    actor_id: profile.id,
    actor_role: profile.role,
    action: "update",
    table_name: "student_term_reports",
    record_id: parsed.data.studentId,
    details: {
      event: "student_report_details_updated",
      upload_id: parsed.data.uploadId,
      student_id: parsed.data.studentId,
      edited_after_publish: hasPublishedRows,
      reason: parsed.data.reasonForEdit?.trim() || null,
    },
  });

  revalidatePath(`/dashboard/results/${parsed.data.uploadId}/review`);

  return { ok: true, message: "Student report details updated." };
}

export async function updateClassTermReportSettingsAction(input: unknown): Promise<ResultActionState> {
  const profile = await requireCanManageResultOperations();
  const parsed = classTermReportSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the class term report settings.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: upload, error: uploadError } = await supabase
    .from("result_uploads")
    .select("id, class_id, term, academic_year, status")
    .eq("id", parsed.data.uploadId)
    .eq("school_id", profile.school_id)
    .maybeSingle();

  if (uploadError || !upload) {
    return { ok: false, message: uploadError?.message ?? "Result upload was not found." };
  }

  const termEndsOn = cleanDate(parsed.data.termEndsOn);
  const nextTermBeginsOn = cleanDate(parsed.data.nextTermBeginsOn);

  if (termEndsOn && nextTermBeginsOn && nextTermBeginsOn <= termEndsOn) {
    return { ok: false, message: "Next Term Begins should be after Term Ends." };
  }

  const { error } = await supabase.from("class_term_report_settings").upsert(
    {
      school_id: profile.school_id,
      class_id: upload.class_id,
      academic_year: upload.academic_year,
      term: upload.term,
      school_open_days: parsed.data.schoolOpenDays ?? null,
      term_ends_on: termEndsOn,
      next_term_begins_on: nextTermBeginsOn,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "school_id,class_id,academic_year,term" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  await supabase.from("audit_logs").insert({
    school_id: profile.school_id,
    actor_id: profile.id,
    actor_role: profile.role,
    action: "update",
    table_name: "class_term_report_settings",
    record_id: upload.id,
    details: {
      event: "class_term_report_settings_updated",
      upload_id: upload.id,
      edited_after_publish: upload.status === "published",
    },
  });

  revalidatePath(`/dashboard/results/${upload.id}/review`);

  return { ok: true, message: "Class term report settings updated." };
}
