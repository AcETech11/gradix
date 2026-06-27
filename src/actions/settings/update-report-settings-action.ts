"use server";

import { reportSettingsSchema, type SettingsActionState } from "@/lib/settings/settings-types";

import { getSchoolForUpdate, logSettingsAudit, mapZodErrors, requireSettingsViewer, revalidateSettings } from "./settings-helpers";

export async function updateReportSettingsAction(input: unknown): Promise<SettingsActionState> {
  const parsed = reportSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the report settings.", fieldErrors: mapZodErrors(parsed.error) };
  }

  try {
    const profile = await requireSettingsViewer();
    const { supabase, metadata } = await getSchoolForUpdate(profile.school_id);
    const reportSettings = {
      ...parsed.data,
      principalComment: parsed.data.principalComment?.trim() ?? "",
      classTeacherComment: parsed.data.classTeacherComment?.trim() ?? "",
      footerNote: parsed.data.footerNote?.trim() ?? "",
    };
    const oldSettings = metadata.report_settings ?? null;
    const nextMetadata = {
      ...metadata,
      report_settings: reportSettings,
    };
    const { error } = await supabase.from("schools").update({ metadata: nextMetadata }).eq("id", profile.school_id);

    if (error) {
      throw error;
    }

    await logSettingsAudit({
      schoolId: profile.school_id,
      actorId: profile.id,
      actorRole: profile.role,
      action: "report_settings_updated",
      details: { old_values: oldSettings, new_values: reportSettings },
    });
    revalidateSettings();

    return { ok: true, message: "Report settings updated." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Report settings could not be updated." };
  }
}
