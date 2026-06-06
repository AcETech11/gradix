"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { canEditResultScores } from "@/lib/results/permissions";
import { resultScoreSchema, type ResultActionState } from "@/lib/results/result-types";
import { createClient } from "@/lib/supabase/server";

export async function updateResultScoreAction(input: unknown): Promise<ResultActionState> {
  const profile = await requireRole(["admin", "headmaster", "teacher"]);
  const parsed = resultScoreSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the score values and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (!canEditResultScores(profile)) {
    return {
      ok: false,
      message: "Only admins can edit result scores.",
    };
  }

  const supabase = await createClient();
  const { data: result, error: resultError } = await supabase
    .from("results")
    .select("id, upload_id, school_id, student_id, subject_id, continuous_assessment, exam_score, remark, is_published")
    .eq("id", parsed.data.resultId)
    .eq("school_id", profile.school_id)
    .maybeSingle();

  if (resultError || !result) {
    return {
      ok: false,
      message: resultError?.message ?? "Result row was not found.",
    };
  }

  const [studentResult, subjectResult] = await Promise.all([
    supabase.from("students").select("first_name, middle_name, last_name").eq("id", result.student_id).eq("school_id", profile.school_id).maybeSingle(),
    supabase.from("subjects").select("name").eq("id", result.subject_id).eq("school_id", profile.school_id).maybeSingle(),
  ]);

  const { error: updateError } = await supabase
    .from("results")
    .update({
      continuous_assessment: parsed.data.continuousAssessment,
      exam_score: parsed.data.examScore,
      remark: parsed.data.remark || null,
    })
    .eq("id", result.id)
    .eq("school_id", profile.school_id);

  if (updateError) {
    return {
      ok: false,
      message: updateError.message,
    };
  }

  await supabase.from("audit_logs").insert({
    school_id: profile.school_id,
    actor_id: profile.id,
    actor_role: profile.role,
    action: "update",
    table_name: "results",
    record_id: result.id,
    details: {
      upload_id: result.upload_id,
      student_id: result.student_id,
      student_name: studentResult.data
        ? [studentResult.data.first_name, studentResult.data.middle_name, studentResult.data.last_name].filter(Boolean).join(" ")
        : "Unknown student",
      subject: subjectResult.data?.name ?? "Unknown subject",
      old_values: {
        continuous_assessment: result.continuous_assessment,
        exam_score: result.exam_score,
        remark: result.remark,
      },
      new_values: {
        continuous_assessment: parsed.data.continuousAssessment,
        exam_score: parsed.data.examScore,
        remark: parsed.data.remark || null,
      },
      edited_after_publish: result.is_published,
    },
  });

  revalidatePath(`/dashboard/results/${result.upload_id}/review`);

  return {
    ok: true,
    message: result.is_published ? "Score updated and flagged as edited after publish." : "Score updated.",
  };
}
