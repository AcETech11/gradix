"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/supabase/database";

export async function validateResultUploadAction(uploadId: string) {
  await requireRole(["admin", "headmaster", "teacher"]);

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
  await requireRole(["admin", "headmaster", "teacher"]);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("calculate_grade", {
    total_score: totalScore,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
