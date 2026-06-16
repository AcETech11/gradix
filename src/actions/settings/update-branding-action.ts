"use server";

import { brandingSchema, type SettingsActionState } from "@/lib/settings/settings-types";

import { getSchoolForUpdate, logSettingsAudit, mapZodErrors, requireSettingsAdmin, revalidateSettings } from "./settings-helpers";

export async function updateBrandingAction(input: unknown): Promise<SettingsActionState> {
  const parsed = brandingSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the branding fields.", fieldErrors: mapZodErrors(parsed.error) };
  }

  try {
    const profile = await requireSettingsAdmin();
    const { supabase, school, metadata } = await getSchoolForUpdate(profile.school_id);
    const nextMetadata = {
      ...metadata,
      logo_url: parsed.data.logoUrl || "",
      school_logo_url: parsed.data.logoUrl || "",
      seal_url: parsed.data.sealUrl || "",
      school_seal_url: parsed.data.sealUrl || "",
      stamp_url: parsed.data.sealUrl || "",
      school_stamp_url: parsed.data.sealUrl || "",
      primary_color: parsed.data.primaryColor,
      secondary_color: parsed.data.secondaryColor,
      principal_signature_url: parsed.data.principalSignatureUrl || "",
      headmaster_signature_url: parsed.data.principalSignatureUrl || "",
    };
    const { error } = await supabase
      .from("schools")
      .update({
        logo_url: parsed.data.logoUrl || null,
        seal_url: parsed.data.sealUrl || null,
        headmaster_signature_url: parsed.data.principalSignatureUrl || null,
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
      action: "branding_updated",
      details: {
        security_event: "school_branding_assets_updated",
        old_values: { logo_url: school.logo_url, seal_url: school.seal_url, signature_url: school.headmaster_signature_url },
        new_values: {
          logo_url: parsed.data.logoUrl,
          seal_url: parsed.data.sealUrl,
          signature_url: parsed.data.principalSignatureUrl,
          primary_color: parsed.data.primaryColor,
          secondary_color: parsed.data.secondaryColor,
        },
      },
    });
    revalidateSettings();

    return { ok: true, message: "Branding updated." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Branding could not be updated." };
  }
}
