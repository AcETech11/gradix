"use server";

import { schoolProfileSchema, type SettingsActionState } from "@/lib/settings/settings-types";

import { getSchoolForUpdate, logSettingsAudit, mapZodErrors, requireSettingsAdmin, revalidateSettings } from "./settings-helpers";

export async function updateSchoolProfileAction(input: unknown): Promise<SettingsActionState> {
  const parsed = schoolProfileSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the school profile fields.", fieldErrors: mapZodErrors(parsed.error) };
  }

  try {
    const profile = await requireSettingsAdmin();
    const { supabase, school, metadata } = await getSchoolForUpdate(profile.school_id);
    const nextMetadata = {
      ...metadata,
      school_type: parsed.data.schoolType ?? "",
      principal_name: parsed.data.principalName ?? "",
    };
    const { error } = await supabase
      .from("schools")
      .update({
        name: parsed.data.name,
        motto: parsed.data.motto || null,
        address_line_1: parsed.data.address || null,
        city: parsed.data.city || null,
        state: parsed.data.state || null,
        country: parsed.data.country,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        website: parsed.data.website || null,
        metadata: nextMetadata,
      })
      .eq("id", profile.school_id);

    if (error) {
      throw error;
    }

    await logSettingsAudit({
      schoolId: profile.school_id,
      actorId: profile.id,
      actorRole: profile.role,
      action: "school_profile_updated",
      details: {
        old_values: { name: school.name, email: school.email, phone: school.phone },
        new_values: { name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone },
      },
    });
    revalidateSettings();

    return { ok: true, message: "School profile updated." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "School profile could not be updated." };
  }
}
