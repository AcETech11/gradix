"use server";

import { revalidatePath } from "next/cache";

import { requireCanManageResults } from "@/lib/auth/authorization";
import { classTeacherCommentSchema, type ResultActionState } from "@/lib/results/result-types";
import { createClient } from "@/lib/supabase/server";
import { getMetadataObject } from "@/lib/settings/settings-types";
import type { Json } from "@/types/database";

export async function updateClassTeacherCommentAction(input: unknown): Promise<ResultActionState<{ comment: string }>> {
  const profile = await requireCanManageResults();
  const parsed = classTeacherCommentSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the class teacher comment.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: rows, error: rowsError } = await supabase
    .from("results")
    .select("id, metadata, class_id, term, academic_year, is_published")
    .eq("school_id", profile.school_id)
    .eq("upload_id", parsed.data.uploadId)
    .eq("student_id", parsed.data.studentId);

  if (rowsError || !rows?.length) {
    return { ok: false, message: rowsError?.message ?? "Result rows were not found for this student." };
  }

  const firstRow = rows[0];
  const { error: reportError } = await supabase.from("student_term_reports").upsert(
    {
      school_id: profile.school_id,
      student_id: parsed.data.studentId,
      class_id: firstRow.class_id,
      academic_year: firstRow.academic_year,
      term: firstRow.term,
      upload_id: parsed.data.uploadId,
      class_teacher_comment: parsed.data.comment,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "school_id,student_id,class_id,academic_year,term,upload_id" },
  );

  if (reportError) {
    return { ok: false, message: reportError.message };
  }

  for (const row of rows) {
    const metadata = {
      ...getMetadataObject(row.metadata),
      class_teacher_comment: parsed.data.comment,
    } satisfies Record<string, Json | undefined>;
    const { error } = await supabase.from("results").update({ metadata }).eq("id", row.id).eq("school_id", profile.school_id);

    if (error) {
      return { ok: false, message: error.message };
    }
  }

  await supabase.from("audit_logs").insert({
    school_id: profile.school_id,
    actor_id: profile.id,
    actor_role: profile.role,
    action: "update",
    table_name: "results",
    record_id: rows[0]?.id ?? null,
    details: {
      event: "class_teacher_comment_updated",
      upload_id: parsed.data.uploadId,
      student_id: parsed.data.studentId,
      edited_after_publish: rows.some((row) => row.is_published),
    },
  });

  revalidatePath(`/dashboard/results/${parsed.data.uploadId}`);
  revalidatePath(`/dashboard/results/${parsed.data.uploadId}/review`);

  return { ok: true, message: "Class teacher comment updated.", data: { comment: parsed.data.comment } };
}
