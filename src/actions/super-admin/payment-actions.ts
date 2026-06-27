"use server";

import { revalidatePath } from "next/cache";

import { addBillingPeriodToDate, PAYMENT_PROOF_BUCKET } from "@/lib/billing/manual-payment";
import { paymentRejectionSchema, paymentReviewSchema, type PaymentRejectionInput, type PaymentReviewInput } from "@/lib/billing/payment-schema";
import { requirePlatformAdmin } from "@/lib/platform-admin/auth";
import { toSubscriptionStatus } from "@/lib/platform-admin/billing";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export type PlatformPaymentRow = {
  id: string;
  schoolId: string;
  schoolName: string;
  schoolEmail: string | null;
  plan: string;
  billingPeriod: string;
  amountExpected: number | null;
  amountPaid: number;
  currency: string;
  paymentReference: string;
  bankTransferReference: string | null;
  payerName: string;
  payerBank: string;
  paidAt: string;
  createdAt: string;
  status: "pending_verification" | "approved" | "rejected" | "cancelled";
  proofSignedUrl: string | null;
  subscriptionStatus: string;
  rejectionReason: string | null;
};

export async function getPlatformPayments(): Promise<{ pendingCount: number; payments: PlatformPaymentRow[] }> {
  await requirePlatformAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payment_submissions")
    .select("*, schools(id, name, email, subscription_status, metadata)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  const payments = await Promise.all(
    (data ?? []).map(async (row) => {
      const { data: signed } = await supabase.storage.from(PAYMENT_PROOF_BUCKET).createSignedUrl(row.proof_path, 60 * 10);
      const school = Array.isArray(row.schools) ? row.schools[0] : row.schools;
      const metadata = school?.metadata && typeof school.metadata === "object" && !Array.isArray(school.metadata) ? school.metadata : {};
      const billingStatus = typeof metadata.billing_status === "string" ? metadata.billing_status : school?.subscription_status;

      return {
        id: row.id,
        schoolId: row.school_id,
        schoolName: school?.name ?? "Unknown school",
        schoolEmail: school?.email ?? null,
        plan: row.subscription_plan,
        billingPeriod: row.billing_period,
        amountExpected: row.amount_expected === null ? null : Number(row.amount_expected),
        amountPaid: Number(row.amount_paid),
        currency: row.currency,
        paymentReference: row.payment_reference,
        bankTransferReference: row.bank_transfer_reference,
        payerName: row.payer_name,
        payerBank: row.payer_bank,
        paidAt: row.paid_at,
        createdAt: row.created_at,
        status: row.status,
        proofSignedUrl: signed?.signedUrl ?? null,
        subscriptionStatus: billingStatus ?? "unknown",
        rejectionReason: row.rejection_reason,
      } satisfies PlatformPaymentRow;
    }),
  );

  return {
    pendingCount: payments.filter((payment) => payment.status === "pending_verification").length,
    payments,
  };
}

export async function approvePaymentSubmissionAction(input: PaymentReviewInput) {
  const parsed = paymentReviewSchema.safeParse(input);

  if (!parsed.success) return { ok: false, message: "Choose a valid payment submission." };

  const platformAdmin = await requirePlatformAdmin();
  const supabase = createAdminClient();
  const { data: submission, error } = await supabase.from("payment_submissions").select("*").eq("id", parsed.data.submissionId).maybeSingle();

  if (error || !submission) return { ok: false, message: error?.message ?? "Payment submission was not found." };
  if (submission.status !== "pending_verification") return { ok: false, message: "This payment has already been reviewed." };

  const now = new Date();
  const expiresAt = addBillingPeriodToDate(submission.billing_period, now).toISOString();
  const schoolSnapshot = await getSchoolBillingSnapshot(submission.school_id);
  const metadata = mergeMetadata(schoolSnapshot.metadata, {
    billing_status: "active",
    last_manual_payment_id: submission.id,
    last_manual_payment_reference: submission.payment_reference,
  });
  const oldExpiry = schoolSnapshot.expiresAt ? new Date(schoolSnapshot.expiresAt) : null;
  const subscriptionEvent = oldExpiry && oldExpiry > now ? "manual_subscription_extended" : "manual_subscription_activated";

  const { error: schoolError } = await supabase
    .from("schools")
    .update({
      subscription_status: toSubscriptionStatus("active"),
      subscription_plan: submission.subscription_plan,
      subscription_started_at: now.toISOString(),
      subscription_expires_at: expiresAt,
      subscription_ends_at: expiresAt,
      metadata,
      updated_at: now.toISOString(),
    })
    .eq("id", submission.school_id);

  if (schoolError) return { ok: false, message: schoolError.message };

  const { error: updateError } = await supabase
    .from("payment_submissions")
    .update({
      status: "approved",
      reviewed_by: platformAdmin.id,
      reviewed_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", submission.id)
    .eq("status", "pending_verification");

  if (updateError) return { ok: false, message: updateError.message };

  await supabase.from("manual_payment_requests").update({ status: "approved", updated_at: now.toISOString() }).eq("id", submission.payment_request_id);
  await supabase.from("platform_audit_logs").insert({
    platform_admin_id: platformAdmin.id,
    actor_user_id: platformAdmin.user_id,
    action: "manual_payment_approved",
    entity_type: "payment_submission",
    entity_id: submission.id,
    details: {
      school_id: submission.school_id,
      payment_submission_id: submission.id,
      old_status: "pending_verification",
      new_status: "approved",
      subscription_expires_at: expiresAt,
    },
  });
  await supabase.from("platform_audit_logs").insert({
    platform_admin_id: platformAdmin.id,
    actor_user_id: platformAdmin.user_id,
    action: subscriptionEvent,
    entity_type: "school",
    entity_id: submission.school_id,
    details: {
      school_id: submission.school_id,
      payment_submission_id: submission.id,
      payment_reference: submission.payment_reference,
      previous_subscription_status: schoolSnapshot.subscriptionStatus,
      previous_subscription_expires_at: schoolSnapshot.expiresAt,
      new_subscription_status: "active",
      new_subscription_expires_at: expiresAt,
    },
  });

  revalidatePath("/super-admin/payments");
  revalidatePath("/super-admin");
  revalidatePath("/dashboard/billing");
  return { ok: true, message: "Payment approved and subscription activated." };
}

export async function rejectPaymentSubmissionAction(input: PaymentRejectionInput) {
  const parsed = paymentRejectionSchema.safeParse(input);

  if (!parsed.success) return { ok: false, message: "Enter a valid rejection reason." };

  const platformAdmin = await requirePlatformAdmin();
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data: submission, error } = await supabase.from("payment_submissions").select("*").eq("id", parsed.data.submissionId).maybeSingle();

  if (error || !submission) return { ok: false, message: error?.message ?? "Payment submission was not found." };
  if (submission.status !== "pending_verification") return { ok: false, message: "This payment has already been reviewed." };

  const { error: updateError } = await supabase
    .from("payment_submissions")
    .update({
      status: "rejected",
      reviewed_by: platformAdmin.id,
      reviewed_at: now,
      rejection_reason: parsed.data.rejectionReason,
      updated_at: now,
    })
    .eq("id", submission.id)
    .eq("status", "pending_verification");

  if (updateError) return { ok: false, message: updateError.message };

  await supabase.from("manual_payment_requests").update({ status: "open", updated_at: now }).eq("id", submission.payment_request_id);
  await supabase.from("platform_audit_logs").insert({
    platform_admin_id: platformAdmin.id,
    actor_user_id: platformAdmin.user_id,
    action: "manual_payment_rejected",
    entity_type: "payment_submission",
    entity_id: submission.id,
    details: {
      school_id: submission.school_id,
      payment_submission_id: submission.id,
      old_status: "pending_verification",
      new_status: "rejected",
      rejection_reason: parsed.data.rejectionReason,
    },
  });

  revalidatePath("/super-admin/payments");
  revalidatePath("/dashboard/billing");
  return { ok: true, message: "Payment rejected. The school can submit corrected details." };
}

async function getSchoolBillingSnapshot(schoolId: string): Promise<{ metadata: Json; subscriptionStatus: string | null; expiresAt: string | null }> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("schools").select("metadata, subscription_status, subscription_expires_at, subscription_ends_at").eq("id", schoolId).maybeSingle();

  return {
    metadata: data?.metadata ?? {},
    subscriptionStatus: data?.subscription_status ?? null,
    expiresAt: data?.subscription_expires_at ?? data?.subscription_ends_at ?? null,
  };
}

function mergeMetadata(metadata: Json, updates: Record<string, Json>) {
  const base = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {};
  return { ...base, ...updates };
}
