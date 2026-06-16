"use server";

import { createClient } from "@/lib/supabase/server";
import type { SchoolInvitation } from "@/lib/settings/settings-types";

import { requireSettingsViewer } from "./settings-helpers";

export async function getStaffInvitationsAction(): Promise<SchoolInvitation[]> {
  const profile = await requireSettingsViewer();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_invitations")
    .select("id, full_name, email, role, status, expires_at, created_at, token")
    .eq("school_id", profile.school_id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
