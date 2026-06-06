"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  assertResourceBelongsToSchool,
  requireCanManageResultOperations,
} from "@/lib/auth/authorization";

export async function validateResultUploadAction(uploadId: string) {
  const profile = await requireCanManageResultOperations();
  await assertResourceBelongsToSchool("result_uploads", uploadId, profile.school_id);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("validate_result_upload", {
    target_upload_id: uploadId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");

  return data;
}

export async function calculateGradeAction(totalScore: number) {
  await requireCanManageResultOperations();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("calculate_grade", {
    total_score: totalScore,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
