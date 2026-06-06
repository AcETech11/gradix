"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { canArchiveResultUpload } from "@/lib/results/permissions";
import { createClient } from "@/lib/supabase/server";
import type { ResultActionState } from "@/lib/results/result-types";

export async function archiveUploadAction(uploadId: string): Promise<ResultActionState> {
  const profile = await requireRole(["admin"]);

  if (!canArchiveResultUpload(profile)) {
    return { ok: false, message: "Only admins can archive uploads." };
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

  const { error } = await supabase
    .from("result_uploads")
    .update({ status: "archived" })
    .eq("id", upload.id)
    .eq("school_id", profile.school_id);

  if (error) {
    return { ok: false, message: error.message };
  }

  await supabase.from("audit_logs").insert({
    school_id: profile.school_id,
    actor_id: profile.id,
    actor_role: profile.role,
    action: "update",
    table_name: "result_uploads",
    record_id: upload.id,
    details: {
      upload_id: upload.id,
      class_id: upload.class_id,
      term: upload.term,
      academic_year: upload.academic_year,
      old_status: upload.status,
      new_status: "archived",
    },
  });

  revalidatePath("/dashboard/results");
  revalidatePath(`/dashboard/results/${upload.id}`);

  return { ok: true, message: "Upload archived." };
}
