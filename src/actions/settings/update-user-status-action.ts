"use server";

import { revalidatePath } from "next/cache";

import { userStatusSchema, type SettingsActionState } from "@/lib/settings/settings-types";
import { createClient } from "@/lib/supabase/server";

import { logSettingsAudit, mapZodErrors, requireSettingsAdmin } from "./settings-helpers";

export async function updateUserStatusAction(input: unknown): Promise<SettingsActionState> {
  const parsed = userStatusSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Choose a valid user status.", fieldErrors: mapZodErrors(parsed.error) };
  }

  try {
    const profile = await requireSettingsAdmin();

    if (profile.id === parsed.data.userId && !parsed.data.isActive) {
      return { ok: false, message: "You cannot deactivate your own account from this screen." };
    }

    const supabase = await createClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, is_active, full_name")
      .eq("id", parsed.data.userId)
      .eq("school_id", profile.school_id)
      .maybeSingle();

    if (userError || !user) {
      throw new Error(userError?.message ?? "User was not found.");
    }

    const { error } = await supabase.from("users").update({ is_active: parsed.data.isActive }).eq("id", user.id).eq("school_id", profile.school_id);

    if (error) {
      throw error;
    }

    await logSettingsAudit({
      schoolId: profile.school_id,
      actorId: profile.id,
      actorRole: profile.role,
      action: parsed.data.isActive ? "user_reactivated" : "user_deactivated",
      details: { user_id: user.id, user_name: user.full_name, old_status: user.is_active, new_status: parsed.data.isActive },
    });
    revalidatePath("/dashboard/settings");

    return { ok: true, message: parsed.data.isActive ? "User reactivated." : "User deactivated." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "User status could not be updated." };
  }
}
