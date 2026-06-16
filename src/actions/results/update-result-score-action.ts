"use server";

import { revalidatePath } from "next/cache";

import { requireCanManageResults } from "@/lib/auth/authorization";
import { resultScoreSchema, type ResultActionState } from "@/lib/results/result-types";
import { createClient } from "@/lib/supabase/server";

export async function updateResultScoreAction(input: unknown): Promise<ResultActionState> {
  const profile = await requireCanManageResults();
  const parsed = resultScoreSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the score values and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: result, error: resultError } = await supabase
    .from("results")
    .select("id, upload_id, school_id, student_id, subject_id, class_id, academic_year, term, continuous_assessment, exam_score, total_score, grade, remark, is_published")
    .eq("id", parsed.data.resultId)
    .eq("school_id", profile.school_id)
    .maybeSingle();

  if (resultError || !result) {
    return {
      ok: false,
      message: resultError?.message ?? "Result row was not found.",
    };
  }

  if (result.is_published && (!parsed.data.reasonForEdit || parsed.data.reasonForEdit.trim().length < 5)) {
    return {
      ok: false,
      message: "Please provide a reason for editing this published result.",
      fieldErrors: { reasonForEdit: ["Please provide a reason for editing this published result."] },
    };
  }

  const [studentResult, subjectResult] = await Promise.all([
    supabase.from("students").select("first_name, middle_name, last_name").eq("id", result.student_id).eq("school_id", profile.school_id).maybeSingle(),
    supabase.from("subjects").select("name").eq("id", result.subject_id).eq("school_id", profile.school_id).maybeSingle(),
  ]);

  const { data: updatedResult, error: updateError } = await supabase
    .from("results")
    .update({
      continuous_assessment: parsed.data.continuousAssessment,
      exam_score: parsed.data.examScore,
      remark: parsed.data.remark || null,
    })
    .eq("id", result.id)
    .eq("school_id", profile.school_id)
    .select("continuous_assessment, exam_score, total_score, grade, remark, edited_at")
    .single();

  if (updateError) {
    return {
      ok: false,
      message: updateError.message,
    };
  }

  await supabase.rpc("recalculate_result_positions", {
    target_school_id: profile.school_id,
    target_class_id: result.class_id,
    target_term: result.term,
    target_academic_year: result.academic_year,
  });

  await supabase.from("audit_logs").insert({
    school_id: profile.school_id,
    actor_id: profile.id,
    actor_role: profile.role,
    action: "update",
    table_name: "results",
    record_id: result.id,
    details: {
      event: result.is_published ? "published_result_edited" : "result_score_edited",
      upload_id: result.upload_id,
      student_id: result.student_id,
      student_name: studentResult.data
        ? [studentResult.data.first_name, studentResult.data.middle_name, studentResult.data.last_name].filter(Boolean).join(" ")
        : "Unknown student",
      subject_id: result.subject_id,
      subject_name: subjectResult.data?.name ?? "Unknown subject",
      class_id: result.class_id,
      academic_year: result.academic_year,
      term: result.term,
      old_ca_score: result.continuous_assessment,
      new_ca_score: updatedResult.continuous_assessment,
      old_exam_score: result.exam_score,
      new_exam_score: updatedResult.exam_score,
      old_total_score: result.total_score,
      new_total_score: updatedResult.total_score,
      old_grade: result.grade,
      new_grade: updatedResult.grade,
      old_remark: result.remark,
      new_remark: updatedResult.remark,
      reason_for_edit: parsed.data.reasonForEdit?.trim() || null,
      edited_by: profile.id,
      edited_at: updatedResult.edited_at ?? new Date().toISOString(),
      old_values: {
        continuous_assessment: result.continuous_assessment,
        exam_score: result.exam_score,
        remark: result.remark,
      },
      new_values: {
        continuous_assessment: updatedResult.continuous_assessment,
        exam_score: updatedResult.exam_score,
        total_score: updatedResult.total_score,
        grade: updatedResult.grade,
        remark: updatedResult.remark,
      },
      edited_after_publish: result.is_published,
    },
  });

  revalidatePath(`/dashboard/results/${result.upload_id}/review`);
  revalidatePath("/results");

  return {
    ok: true,
    message: result.is_published ? "Score updated and flagged as edited after publish." : "Score updated.",
  };
}
