import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import { requireCanManageSettings, requireCanManageUsers, requireCanViewSettings } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { getMetadataObject } from "@/lib/settings/settings-types";
import type { AppRole, Json } from "@/types/database";

export function mapZodErrors(error: ZodError) {
  return error.issues.reduce<Record<string, string[]>>((accumulator, issue) => {
    const field = issue.path.map((part) => String(part)).join(".");
    accumulator[field] = [...(accumulator[field] ?? []), issue.message];
    return accumulator;
  }, {});
}

export async function requireSettingsAdmin() {
  return requireCanManageSettings();
}

export async function requireSettingsViewer() {
  return requireCanViewSettings();
}

export async function requireUserManager() {
  return requireCanManageUsers();
}

export async function getSchoolForUpdate(schoolId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("schools").select("*").eq("id", schoolId).maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "School profile was not found.");
  }

  return { supabase, school: data, metadata: getMetadataObject(data.metadata) };
}

export async function logSettingsAudit(input: {
  schoolId: string;
  actorId: string;
  actorRole: AppRole;
  action: string;
  details: Record<string, Json | undefined>;
}) {
  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    school_id: input.schoolId,
    actor_id: input.actorId,
    actor_role: input.actorRole,
    action: "update",
    table_name: "schools",
    record_id: input.schoolId,
    details: {
      settings_action: input.action,
      ...input.details,
    },
  });
}

export function revalidateSettings() {
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/results");
}
