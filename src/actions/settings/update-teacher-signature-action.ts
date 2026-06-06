"use server";

import { z } from "zod";

import { getMetadataObject, type SettingsActionState } from "@/lib/settings/settings-types";
import type { Json } from "@/types/database";

import { logSettingsAudit, mapZodErrors, requireUserManager, revalidateSettings } from "./settings-helpers";
import { createClient } from "@/lib/supabase/server";

const teacherSignatureSchema = z.object({
  userId: z.string().uuid(),
  signatureUrl: z.string().url("Upload a valid signature image."),
});

export async function updateTeacherSignatureAction(input: unknown): Promise<SettingsActionState> {
  const parsed = teacherSignatureSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the teacher signature upload.", fieldErrors: mapZodErrors(parsed.error) };
  }

  try {
    const profile = await requireUserManager();
    const supabase = await createClient();
    const { data: teacher, error: teacherError } = await supabase
      .from("users")
      .select("id, full_name, role, metadata")
      .eq("id", parsed.data.userId)
      .eq("school_id", profile.school_id)
      .maybeSingle();

    if (teacherError || !teacher) {
      throw new Error(teacherError?.message ?? "Teacher was not found in your school workspace.");
    }

    if (teacher.role !== "teacher") {
      throw new Error("Signatures can only be uploaded here for teacher users.");
    }

    const metadata = {
      ...getMetadataObject(teacher.metadata),
      teacher_signature_url: parsed.data.signatureUrl,
    } satisfies Record<string, Json | undefined>;
    const { error } = await supabase.from("users").update({ metadata }).eq("id", teacher.id).eq("school_id", profile.school_id);

    if (error) {
      throw error;
    }

    await logSettingsAudit({
      schoolId: profile.school_id,
      actorId: profile.id,
      actorRole: profile.role,
      action: "teacher_signature_updated",
      details: {
        staff_user_id: teacher.id,
        staff_name: teacher.full_name,
      },
    });
    revalidateSettings();

    return { ok: true, message: "Teacher signature updated." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Teacher signature could not be updated." };
  }
}
