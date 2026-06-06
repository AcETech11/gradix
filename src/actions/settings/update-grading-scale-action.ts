"use server";

import { gradingScaleSchema, type SettingsActionState } from "@/lib/settings/settings-types";
import { validateGradingScaleBands } from "@/lib/settings/validate-grading-scale";

import { getSchoolForUpdate, logSettingsAudit, mapZodErrors, requireSettingsAdmin, revalidateSettings } from "./settings-helpers";

export async function updateGradingScaleAction(input: unknown): Promise<SettingsActionState> {
  const parsed = gradingScaleSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the grading scale.", fieldErrors: mapZodErrors(parsed.error) };
  }

  const validationError = validateGradingScaleBands(parsed.data.bands);

  if (validationError) {
    return { ok: false, message: validationError };
  }

  try {
    const profile = await requireSettingsAdmin();
    const { supabase, metadata } = await getSchoolForUpdate(profile.school_id);
    const oldScale = metadata.grading_scale ?? null;
    const nextMetadata = {
      ...metadata,
      grading_scale: parsed.data.bands,
    };
    const { error } = await supabase.from("schools").update({ metadata: nextMetadata }).eq("id", profile.school_id);

    if (error) {
      throw error;
    }

    await logSettingsAudit({
      schoolId: profile.school_id,
      actorId: profile.id,
      actorRole: profile.role,
      action: "grading_scale_updated",
      details: { old_values: oldScale, new_values: parsed.data.bands },
    });
    revalidateSettings();

    return { ok: true, message: "Grading scale updated. Future calculations can use the new scale." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Grading scale could not be updated." };
  }
}
