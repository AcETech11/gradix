"use server";

import { revalidatePath } from "next/cache";

import { requireCanPublishResults } from "@/lib/auth/authorization";
import { canPublishResultUpload, canViewResultUpload } from "@/lib/results/permissions";
import { createClient } from "@/lib/supabase/server";
import type { ResultActionState } from "@/lib/results/result-types";

export async function publishResultsAction(uploadId: string): Promise<ResultActionState> {
  const profile = await requireCanPublishResults();

  if (!canPublishResultUpload(profile)) {
    return { ok: false, message: "Only admins and headmasters can publish results." };
  }

  const supabase = await createClient();
  const { data: upload, error: uploadError } = await supabase
    .from("result_uploads")
    .select("*")
    .eq("id", uploadId)
    .eq("school_id", profile.school_id)
    .maybeSingle();

  if (uploadError || !upload) {
    return { ok: false, message: uploadError?.message ?? "Result upload was not found." };
  }

  if (!canViewResultUpload(profile, upload) || upload.status === "archived") {
    return { ok: false, message: "This upload cannot be published." };
  }

  const { count, error: countError } = await supabase
    .from("results")
    .select("id", { count: "exact", head: true })
    .eq("school_id", profile.school_id)
    .eq("upload_id", upload.id);

  if (countError) {
    return { ok: false, message: countError.message };
  }

  const { error: resultsError } = await supabase
    .from("results")
    .update({ is_published: true })
    .eq("school_id", profile.school_id)
    .eq("upload_id", upload.id);

  if (resultsError) {
    return { ok: false, message: resultsError.message };
  }

  const publishedAt = new Date().toISOString();
  const { error: uploadUpdateError } = await supabase
    .from("result_uploads")
    .update({
      status: "published",
      published_at: publishedAt,
      published_by: profile.id,
    })
    .eq("id", upload.id)
    .eq("school_id", profile.school_id);

  if (uploadUpdateError) {
    return { ok: false, message: uploadUpdateError.message };
  }

  await supabase.from("audit_logs").insert({
    school_id: profile.school_id,
    actor_id: profile.id,
    actor_role: profile.role,
    action: "publish",
    table_name: "result_uploads",
    record_id: upload.id,
    details: {
      upload_id: upload.id,
      class_id: upload.class_id,
      term: upload.term,
      academic_year: upload.academic_year,
      result_count: count ?? 0,
    },
  });

  revalidatePath("/dashboard/results");
  revalidatePath(`/dashboard/results/${upload.id}/review`);

  return { ok: true, message: "Results published." };
}
