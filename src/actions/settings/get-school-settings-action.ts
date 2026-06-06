"use server";

import {
  getGradingScale,
  getMetadataObject,
  getMetadataString,
  getReportSettings,
  type SchoolSettings,
} from "@/lib/settings/settings-types";

import { requireSettingsViewer } from "./settings-helpers";
import { createClient } from "@/lib/supabase/server";

export async function getSchoolSettingsAction(): Promise<SchoolSettings> {
  const profile = await requireSettingsViewer();
  const supabase = await createClient();
  const { data: school, error } = await supabase.from("schools").select("*").eq("id", profile.school_id).maybeSingle();

  if (error || !school) {
    throw new Error(error?.message ?? "School profile was not found.");
  }

  const metadata = getMetadataObject(school.metadata);

  return {
    school,
    profile: {
      name: school.name,
      schoolType: getMetadataString(metadata, "school_type"),
      motto: school.motto ?? "",
      address: school.address_line_1 ?? "",
      city: school.city ?? "",
      state: school.state ?? "",
      country: school.country ?? "Nigeria",
      phone: school.phone ?? "",
      email: school.email ?? "",
      website: school.website ?? "",
      principalName: getMetadataString(metadata, "principal_name", "Principal"),
    },
    branding: {
      logoUrl: school.logo_url ?? "",
      sealUrl: school.seal_url ?? "",
      principalSignatureUrl: school.headmaster_signature_url ?? "",
      primaryColor: getMetadataString(metadata, "primary_color", "#0f172a"),
      secondaryColor: getMetadataString(metadata, "secondary_color", "#f97316"),
    },
    reportSettings: getReportSettings(metadata),
    gradingScale: getGradingScale(metadata),
  };
}
