"use server";

import { revalidatePath } from "next/cache";

import { userRoleSchema, type SettingsActionState } from "@/lib/settings/settings-types";
import { createClient } from "@/lib/supabase/server";

import { logSettingsAudit, mapZodErrors, requireSettingsAdmin } from "./settings-helpers";

export async function updateUserRoleAction(input: unknown): Promise<SettingsActionState> {
  const parsed = userRoleSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Choose a valid role.", fieldErrors: mapZodErrors(parsed.error) };
  }

  try {
    const profile = await requireSettingsAdmin();
    const supabase = await createClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, role, full_name")
      .eq("id", parsed.data.userId)
      .eq("school_id", profile.school_id)
      .maybeSingle();

    if (userError || !user) {
      throw new Error(userError?.message ?? "User was not found.");
    }

    const { error } = await supabase.from("users").update({ role: parsed.data.role }).eq("id", user.id).eq("school_id", profile.school_id);

    if (error) {
      throw error;
    }

    await logSettingsAudit({
      schoolId: profile.school_id,
      actorId: profile.id,
      actorRole: profile.role,
      action: "user_role_changed",
      details: { user_id: user.id, user_name: user.full_name, old_role: user.role, new_role: parsed.data.role },
    });
    revalidatePath("/dashboard/settings");

    return { ok: true, message: "User role updated." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "User role could not be updated." };
  }
}
