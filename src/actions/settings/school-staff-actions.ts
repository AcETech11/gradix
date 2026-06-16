"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { SettingsActionState } from "@/lib/settings/settings-types";
import { requireSettingsAdmin } from "./settings-helpers";

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();

  return trimmed === "" || trimmed === "undefined" ? undefined : trimmed;
};

const nullableTrimmedString = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value ?? null;
    const trimmed = value.trim();

    return trimmed === "" ? null : trimmed;
  },
  z.string().nullable(),
);

const optionalUuid = z.preprocess(emptyStringToUndefined, z.string().uuid().optional());

const staffSchema = z.object({
  staffId: optionalUuid,
  fullName: z.string().trim().min(2, "Full name is required."),
  email: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value ?? null;
      const trimmed = value.trim();

      return trimmed === "" ? null : trimmed;
    },
    z.string().email("Enter a valid email.").nullable(),
  ),
  phone: nullableTrimmedString,
  role: z.enum(["admin", "headmaster", "teacher"]).default("teacher"),
});

const statusSchema = z.object({
  staffId: z.string().uuid(),
  isActive: z.boolean(),
});

const signatureSchema = z.object({
  staffId: z.string().uuid(),
  signatureUrl: z.string().url("Upload a valid signature image."),
});

const assignmentSchema = z.object({
  classId: z.string().uuid(),
  staffId: optionalUuid,
});

export async function upsertSchoolStaffAction(input: unknown): Promise<SettingsActionState> {
  const parsed = staffSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: firstZodIssue(parsed.error) ?? "Check the staff details.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const profile = await requireSettingsAdmin();
    if (!profile.school_id) {
      return { ok: false, message: "Your school workspace could not be found." };
    }

    const supabase = await createClient();
    const sharedPayload = {
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      role: parsed.data.role,
      updated_at: new Date().toISOString(),
    };
    const query = parsed.data.staffId
      ? supabase.from("school_staff").update(sharedPayload).eq("id", parsed.data.staffId).eq("school_id", profile.school_id)
      : supabase.from("school_staff").insert({
          ...sharedPayload,
          school_id: profile.school_id,
          is_active: true,
          signature_url: null,
          metadata: {},
        });
    const { error } = await query;

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      school_id: profile.school_id,
      actor_id: profile.id,
      actor_role: profile.role,
      action: parsed.data.staffId ? "update" : "insert",
      table_name: "school_staff",
      record_id: parsed.data.staffId ?? null,
      details: {
        security_event: parsed.data.staffId ? "teacher_staff_updated" : "teacher_staff_created",
        role: parsed.data.role,
      },
    });
    revalidatePath("/dashboard/settings");

    return { ok: true, message: parsed.data.staffId ? "Staff updated." : "Staff created." };
  } catch (error) {
    console.error("[gradix-settings] school staff save failed", error);

    if (error instanceof Error && error.message.toLowerCase().includes("settings")) {
      return { ok: false, message: "Only admins can add staff." };
    }

    return { ok: false, message: "Staff could not be created. Please check the details and try again." };
  }
}

export async function updateSchoolStaffStatusAction(input: unknown): Promise<SettingsActionState> {
  const parsed = statusSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Choose a valid staff member." };
  }

  try {
    const profile = await requireSettingsAdmin();
    const supabase = await createClient();
    const { error } = await supabase
      .from("school_staff")
      .update({ is_active: parsed.data.isActive, updated_at: new Date().toISOString() })
      .eq("id", parsed.data.staffId)
      .eq("school_id", profile.school_id);

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      school_id: profile.school_id,
      actor_id: profile.id,
      actor_role: profile.role,
      action: "update",
      table_name: "school_staff",
      record_id: parsed.data.staffId,
      details: { security_event: parsed.data.isActive ? "teacher_staff_reactivated" : "teacher_staff_deactivated" },
    });
    revalidatePath("/dashboard/settings");

    return { ok: true, message: parsed.data.isActive ? "Staff reactivated." : "Staff deactivated." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Staff status could not be updated." };
  }
}

export async function updateSchoolStaffSignatureAction(input: unknown): Promise<SettingsActionState> {
  const parsed = signatureSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Upload a valid teacher signature." };
  }

  try {
    const profile = await requireSettingsAdmin();
    const supabase = await createClient();
    const { error } = await supabase
      .from("school_staff")
      .update({ signature_url: parsed.data.signatureUrl, updated_at: new Date().toISOString() })
      .eq("id", parsed.data.staffId)
      .eq("school_id", profile.school_id);

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      school_id: profile.school_id,
      actor_id: profile.id,
      actor_role: profile.role,
      action: "update",
      table_name: "school_staff",
      record_id: parsed.data.staffId,
      details: { security_event: "teacher_signature_updated" },
    });
    revalidatePath("/dashboard/settings");

    return { ok: true, message: "Teacher signature updated." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Teacher signature could not be updated." };
  }
}

export async function assignClassTeacherAction(input: unknown): Promise<SettingsActionState> {
  const parsed = assignmentSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Choose a valid class and teacher." };
  }

  try {
    const profile = await requireSettingsAdmin();
    const supabase = await createClient();
    const { data: schoolClass, error: classError } = await supabase
      .from("classes")
      .select("id, teacher_id")
      .eq("id", parsed.data.classId)
      .eq("school_id", profile.school_id)
      .maybeSingle();

    if (classError || !schoolClass) throw new Error(classError?.message ?? "Class was not found.");

    if (parsed.data.staffId) {
      const { data: staff, error: staffError } = await supabase
        .from("school_staff")
        .select("id")
        .eq("id", parsed.data.staffId)
        .eq("school_id", profile.school_id)
        .eq("is_active", true)
        .in("role", ["teacher", "headmaster"])
        .maybeSingle();

      if (staffError || !staff) throw new Error(staffError?.message ?? "Teacher was not found or is inactive.");
    }

    const { error } = await supabase
      .from("classes")
      .update({ teacher_id: parsed.data.staffId ?? null, updated_at: new Date().toISOString() })
      .eq("id", schoolClass.id)
      .eq("school_id", profile.school_id);
    if (error) throw error;

    await supabase.from("audit_logs").insert({
      school_id: profile.school_id,
      actor_id: profile.id,
      actor_role: profile.role,
      action: "update",
      table_name: "classes",
      record_id: schoolClass.id,
      details: {
        security_event: "class_teacher_assigned",
        previous_staff_id: schoolClass.teacher_id,
        staff_id: parsed.data.staffId ?? null,
      },
    });
    revalidatePath("/dashboard/settings");

    return { ok: true, message: "Class teacher assignment updated." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Class teacher could not be assigned." };
  }
}

function firstZodIssue(error: z.ZodError) {
  const issue = error.issues[0];

  if (!issue) return null;
  if (issue.path.includes("fullName")) return "Full name is required.";
  if (issue.path.includes("role")) return "Select a valid role.";

  return issue.message;
}
