"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCanManageUsers } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/types/auth";

const invitationSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the staff member's name."),
  email: z.string().trim().email("Enter a valid email address."),
  role: z.enum(["admin", "headmaster", "teacher"]),
});

export async function createStaffInvitationAction(input: z.input<typeof invitationSchema>): Promise<AuthActionState<{ inviteUrl: string }>> {
  const parsed = invitationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the invitation details and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const profile = await requireCanManageUsers();
  const supabase = await createClient();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from("staff_invitations").insert({
    school_id: profile.school_id,
    email: parsed.data.email.toLowerCase(),
    full_name: parsed.data.fullName,
    role: parsed.data.role,
    token,
    status: "pending",
    invited_by: profile.id,
    expires_at: expiresAt,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  await supabase.from("audit_logs").insert({
    school_id: profile.school_id,
    actor_id: profile.id,
    actor_role: profile.role,
    action: "insert",
    table_name: "staff_invitations",
    details: {
      security_event: "staff_invited",
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
    },
  });

  revalidatePath("/dashboard/settings");

  return {
    ok: true,
    message: "Invitation created. Copy the invite link and send it to the staff member.",
    data: { inviteUrl: `/accept-invite/${token}` },
  };
}

export async function revokeStaffInvitationAction(invitationId: string): Promise<AuthActionState> {
  const profile = await requireCanManageUsers();
  const supabase = await createClient();
  const { data: invitation, error: lookupError } = await supabase
    .from("staff_invitations")
    .select("id, email, role")
    .eq("id", invitationId)
    .eq("school_id", profile.school_id)
    .eq("status", "pending")
    .maybeSingle();

  if (lookupError || !invitation) {
    return { ok: false, message: lookupError?.message ?? "This pending invitation was not found." };
  }

  const { error } = await supabase
    .from("staff_invitations")
    .update({ status: "revoked" })
    .eq("id", invitation.id)
    .eq("school_id", profile.school_id);

  if (error) {
    return { ok: false, message: error.message };
  }

  await supabase.from("audit_logs").insert({
    school_id: profile.school_id,
    actor_id: profile.id,
    actor_role: profile.role,
    action: "update",
    table_name: "staff_invitations",
    record_id: invitation.id,
    details: {
      security_event: "staff_invite_revoked",
      email: invitation.email,
      role: invitation.role,
    },
  });

  revalidatePath("/dashboard/settings");

  return { ok: true, message: "Invitation revoked." };
}

export async function getStaffInvitationAction(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_staff_invitation", { invite_token: token });

  if (error) {
    return { ok: false, message: error.message };
  }

  return data as { ok: boolean; message?: string; email?: string; full_name?: string; role?: string; school_name?: string; expires_at?: string };
}

export async function acceptStaffInvitationAction(token: string): Promise<AuthActionState<{ redirectTo: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_staff_invitation", { invite_token: token });
  const result = data as { ok?: boolean; message?: string } | null;

  if (error || !result?.ok) {
    return { ok: false, message: error?.message ?? result?.message ?? "This invitation could not be accepted." };
  }

  revalidatePath("/dashboard");

  return {
    ok: true,
    message: "Invitation accepted.",
    data: { redirectTo: "/dashboard" },
  };
}
