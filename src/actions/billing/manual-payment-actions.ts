"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/authorization";
import { normalizeBillingPlan } from "@/lib/billing/billing";
import {
  buildPaymentReference,
  formatCurrency,
  getCurrentBillingPeriod,
  getManualPaymentConfig,
  getPlanAmount,
  PAYMENT_PROOF_BUCKET,
  PAYMENT_PROOF_MIME_TYPES,
} from "@/lib/billing/manual-payment";
import { paymentSubmissionSchema } from "@/lib/billing/payment-schema";
import { createClient } from "@/lib/supabase/server";
import type { TableRow } from "@/types/database";

export type SchoolPaymentRequest = {
  id: string;
  paymentReference: string;
  billingPeriod: string;
  amountExpected: number;
  amountExpectedLabel: string;
  currency: string;
  status: string;
};

export type SchoolPaymentSubmission = {
  id: string;
  status: "pending_verification" | "approved" | "rejected" | "cancelled";
  amountPaid: number;
  currency: string;
  payerName: string;
  payerBank: string;
  paidAt: string;
  paymentReference: string;
  bankTransferReference: string | null;
  rejectionReason: string | null;
  createdAt: string;
};

export type SchoolBillingPaymentData = {
  request: SchoolPaymentRequest;
  latestSubmission: SchoolPaymentSubmission | null;
  config: ReturnType<typeof getManualPaymentConfig>;
};

export type PaymentActionState =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[] | undefined> };

export async function getSchoolBillingPaymentData(school: TableRow<"schools">): Promise<SchoolBillingPaymentData> {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const plan = normalizeBillingPlan(school.subscription_plan);
  const billingPeriod = getCurrentBillingPeriod();
  const amountExpected = getPlanAmount(plan);
  const request = await getOrCreatePaymentRequest({
    schoolId: profile.school_id,
    schoolName: school.name,
    plan,
    billingPeriod,
    amountExpected,
  });
  const { data: latestSubmission, error } = await supabase
    .from("payment_submissions")
    .select("id, status, amount_paid, currency, payer_name, payer_bank, paid_at, payment_reference, bank_transfer_reference, rejection_reason, created_at")
    .eq("school_id", profile.school_id)
    .eq("payment_request_id", request.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return {
    request: {
      id: request.id,
      paymentReference: request.payment_reference,
      billingPeriod: request.billing_period,
      amountExpected: Number(request.amount_expected),
      amountExpectedLabel: formatCurrency(Number(request.amount_expected), request.currency),
      currency: request.currency,
      status: request.status,
    },
    latestSubmission: latestSubmission
      ? {
          id: latestSubmission.id,
          status: latestSubmission.status,
          amountPaid: Number(latestSubmission.amount_paid),
          currency: latestSubmission.currency,
          payerName: latestSubmission.payer_name,
          payerBank: latestSubmission.payer_bank,
          paidAt: latestSubmission.paid_at,
          paymentReference: latestSubmission.payment_reference,
          bankTransferReference: latestSubmission.bank_transfer_reference,
          rejectionReason: latestSubmission.rejection_reason,
          createdAt: latestSubmission.created_at,
        }
      : null,
    config: getManualPaymentConfig(),
  };
}

export async function submitManualPaymentAction(input: unknown): Promise<PaymentActionState> {
  const parsed = paymentSubmissionSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the payment details and try again.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const profile = await requireAdmin();
    const supabase = await createClient();
    const { data: request, error: requestError } = await supabase
      .from("manual_payment_requests")
      .select("*")
      .eq("id", parsed.data.paymentRequestId)
      .eq("school_id", profile.school_id)
      .maybeSingle();

    if (requestError || !request) {
      return { ok: false, message: requestError?.message ?? "Payment request was not found." };
    }

    if (request.payment_reference !== parsed.data.paymentReference) {
      return { ok: false, message: "Payment reference does not match this school's active payment request." };
    }

    const { data: existingPending, error: pendingError } = await supabase
      .from("payment_submissions")
      .select("id")
      .eq("school_id", profile.school_id)
      .eq("payment_request_id", request.id)
      .eq("status", "pending_verification")
      .maybeSingle();

    if (pendingError) return { ok: false, message: pendingError.message };
    if (existingPending) return { ok: false, message: "A payment is already awaiting verification for this billing period." };

    if (!PAYMENT_PROOF_MIME_TYPES.includes(parsed.data.proofMimeType)) {
      return { ok: false, message: "Proof of payment must be JPG, PNG, or PDF." };
    }

    const submissionId = crypto.randomUUID();
    const extension = parsed.data.proofMimeType === "application/pdf" ? "pdf" : parsed.data.proofMimeType === "image/png" ? "png" : "jpg";
    const safeName = `${Date.now()}-proof.${extension}`;
    const proofPath = `${profile.school_id}/${submissionId}/${safeName}`;
    const proofBuffer = Buffer.from(parsed.data.proofBase64, "base64");
    const { error: uploadError } = await supabase.storage.from(PAYMENT_PROOF_BUCKET).upload(proofPath, proofBuffer, {
      contentType: parsed.data.proofMimeType,
      upsert: false,
    });

    if (uploadError) return { ok: false, message: uploadError.message };

    const { error: insertError } = await supabase.from("payment_submissions").insert({
      id: submissionId,
      school_id: profile.school_id,
      payment_request_id: request.id,
      payment_reference: request.payment_reference,
      billing_period: request.billing_period,
      subscription_plan: request.subscription_plan,
      amount_expected: request.amount_expected,
      amount_paid: parsed.data.amountPaid,
      currency: request.currency,
      payer_name: parsed.data.payerName,
      payer_bank: parsed.data.payerBank,
      bank_transfer_reference: parsed.data.bankTransferReference || null,
      paid_at: parsed.data.paidAt,
      proof_path: proofPath,
      proof_mime_type: parsed.data.proofMimeType,
      note: parsed.data.note || null,
      status: "pending_verification",
    });

    if (insertError) {
      await supabase.storage.from(PAYMENT_PROOF_BUCKET).remove([proofPath]);
      return { ok: false, message: insertError.message };
    }

    await supabase.from("manual_payment_requests").update({ status: "submitted", updated_at: new Date().toISOString() }).eq("id", request.id);
    await supabase.from("audit_logs").insert({
      school_id: profile.school_id,
      actor_id: profile.id,
      actor_role: profile.role,
      action: "payment_submission_created",
      table_name: "payment_submissions",
      record_id: submissionId,
      details: {
        payment_request_id: request.id,
        payment_reference: request.payment_reference,
        old_status: null,
        new_status: "pending_verification",
      },
    });

    revalidatePath("/dashboard/billing");
    return { ok: true, message: "Payment submitted successfully. Gradix will verify it and activate your school plan." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Payment submission could not be saved." };
  }
}

async function getOrCreatePaymentRequest({
  schoolId,
  schoolName,
  plan,
  billingPeriod,
  amountExpected,
}: {
  schoolId: string;
  schoolName: string;
  plan: string;
  billingPeriod: string;
  amountExpected: number;
}) {
  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("manual_payment_requests")
    .select("*")
    .eq("school_id", schoolId)
    .eq("billing_period", billingPeriod)
    .in("status", ["open", "submitted"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existing) return existing;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const paymentReference = buildPaymentReference(schoolName, billingPeriod);
    const { data, error } = await supabase
      .from("manual_payment_requests")
      .insert({
        school_id: schoolId,
        subscription_plan: plan,
        billing_period: billingPeriod,
        payment_reference: paymentReference,
        amount_expected: amountExpected,
      })
      .select("*")
      .single();

    if (!error && data) return data;
    if (!error?.message.toLowerCase().includes("duplicate")) throw new Error(error?.message ?? "Payment request could not be created.");
  }

  throw new Error("Payment reference could not be generated. Please try again.");
}
