"use server";

import { createClient } from "@/lib/supabase/server";
import type { SchoolUser } from "@/lib/settings/settings-types";

import { requireSettingsViewer } from "./settings-helpers";

export async function getSchoolUsersAction(): Promise<SchoolUser[]> {
  const profile = await requireSettingsViewer();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, role, is_active, created_at, metadata")
    .eq("school_id", profile.school_id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
