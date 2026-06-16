import { createClient } from "@/lib/supabase/server";

import { canMutatePaidWorkflow, getBillingBlockMessage, getBillingState, getStudentLimit } from "./billing";

export async function requireActiveBillingForSchool(schoolId: string) {
  const supabase = await createClient();
  const { data: school, error } = await supabase
    .from("schools")
    .select("id, subscription_status, subscription_plan, subscription_expires_at, subscription_ends_at, student_limit, metadata")
    .eq("id", schoolId)
    .maybeSingle();

  if (error || !school) {
    throw new Error(error?.message ?? "Your school profile was not found.");
  }

  const state = getBillingState(school);

  if (!canMutatePaidWorkflow(state)) {
    throw new Error(getBillingBlockMessage(state) ?? "Your Gradix subscription must be active to continue.");
  }

  return { school, state };
}

export async function assertStudentLimitAvailable(schoolId: string, additionalStudents = 1) {
  const supabase = await createClient();
  const { school } = await requireActiveBillingForSchool(schoolId);
  const limit = getStudentLimit(school);
  const { count, error } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .neq("status", "archived");

  if (error) {
    throw error;
  }

  if ((count ?? 0) + additionalStudents > limit) {
    throw new Error("You have reached the student limit for your current plan. Upgrade your Gradix plan to add more students.");
  }
}
