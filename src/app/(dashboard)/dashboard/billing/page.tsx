import { CreditCard } from "lucide-react";
import type { ReactNode } from "react";

import { getSchoolBillingPaymentData } from "@/actions/billing/manual-payment-actions";
import { CopyButton } from "@/components/billing/CopyButton";
import { ManualPaymentForm } from "@/components/billing/ManualPaymentForm";
import { requireAdmin } from "@/lib/auth/authorization";
import { getBillingExpiry, getBillingState, getStudentLimit, normalizeBillingPlan, PLAN_PRICES } from "@/lib/billing/billing";
import { createClient } from "@/lib/supabase/server";

export default async function BillingPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const [{ data: school, error: schoolError }, { count, error: countError }] = await Promise.all([
    supabase.from("schools").select("*").eq("id", profile.school_id).maybeSingle(),
    supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", profile.school_id).neq("status", "archived"),
  ]);

  if (schoolError || countError || !school) {
    throw new Error(schoolError?.message ?? countError?.message ?? "Your school profile was not found.");
  }

  const plan = normalizeBillingPlan(school.subscription_plan);
  const state = getBillingState(school);
  const expiry = getBillingExpiry(school);
  const payment = await getSchoolBillingPaymentData(school);
  const hasPendingSubmission = payment.latestSubmission?.status === "pending_verification";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-200">
            <CreditCard className="size-6" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-orange-200">Billing</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-50">Gradix subscription</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Transfer with your unique Gradix payment reference, then submit your proof for manual verification.
            </p>
          </div>
        </div>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <BillingStat label="Current plan" value={plan} />
        <BillingStat label="Status" value={state} />
        <BillingStat label="Student limit" value={`${count ?? 0} / ${getStudentLimit(school)}`} />
        <BillingStat label="Renewal amount" value={PLAN_PRICES[plan]} />
      </section>
      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-5">
          <h2 className="font-semibold text-slate-50">Subscription details</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <Row label="Billing cycle" value="Termly" />
            <Row label="Started" value={school.subscription_started_at ? new Date(school.subscription_started_at).toLocaleDateString() : "Not set"} />
            <Row label="Expires" value={expiry ? new Date(expiry).toLocaleDateString() : "Not set"} />
            <Row label="Billing note" value={getMetadataNote(school.metadata)} />
          </dl>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-5">
          <h2 className="font-semibold text-slate-50">Bank transfer details</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <Row label="Bank" value={payment.config.bankName} />
            <Row label="Account name" value={payment.config.accountName} />
            <Row action={<CopyButton value={payment.config.accountNumber} />} label="Account number" value={payment.config.accountNumber} />
            <Row label="Amount due" value={payment.request.amountExpectedLabel} />
            <Row label="Billing period" value={payment.request.billingPeriod} />
            <Row action={<CopyButton value={payment.request.paymentReference} />} label="Payment reference" value={payment.request.paymentReference} />
            <Row label="Support phone" value={payment.config.supportPhone} />
            <Row label="Support email" value={payment.config.supportEmail} />
          </dl>
          <div className="mt-5 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4 text-sm leading-6 text-orange-50">
            <p className="font-semibold">Use this exact reference as your bank transfer narration. It helps us identify your payment faster.</p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-orange-50/85">
              <li>Transfer the exact amount to the displayed account.</li>
              <li>Use the exact Gradix payment reference as transfer narration.</li>
              <li>Click &quot;I Have Made Payment.&quot;</li>
              <li>Submit your transfer details and proof of payment.</li>
              <li>Gradix will verify and activate your plan.</li>
            </ol>
          </div>
        </div>
      </section>
      <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-50">Payment verification</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Your school remains on the current billing status until a Gradix Platform Admin confirms the transfer.
            </p>
          </div>
          <ManualPaymentForm amountExpected={payment.request.amountExpected} disabled={hasPendingSubmission} paymentReference={payment.request.paymentReference} paymentRequestId={payment.request.id} />
        </div>
        {payment.latestSubmission ? <PaymentStatus submission={payment.latestSubmission} /> : null}
      </section>
    </div>
  );
}

function getMetadataNote(metadata: unknown) {
  if (metadata && typeof metadata === "object" && "billing_note" in metadata) {
    const value = (metadata as { billing_note?: unknown }).billing_note;
    return typeof value === "string" && value.trim() ? value : "No note";
  }

  return "No note";
}

function BillingStat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/75 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-bold capitalize text-slate-50">{value}</p>
    </article>
  );
}

function PaymentStatus({ submission }: { submission: NonNullable<Awaited<ReturnType<typeof getSchoolBillingPaymentData>>["latestSubmission"]> }) {
  const message =
    submission.status === "pending_verification"
      ? "Payment submitted — awaiting verification."
      : submission.status === "approved"
        ? "Payment verified — your Gradix plan is active."
        : submission.status === "rejected"
          ? `Payment could not be verified. Reason: ${submission.rejectionReason ?? "Please contact Gradix support."}`
          : "Payment submission was cancelled.";

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200">
      <p className="font-semibold text-slate-50">{message}</p>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <Row label="Submitted" value={new Date(submission.createdAt).toLocaleString()} />
        <Row label="Amount paid" value={`${submission.currency} ${submission.amountPaid.toLocaleString()}`} />
        <Row label="Payer" value={submission.payerName} />
        <Row label="Bank used" value={submission.payerBank} />
      </dl>
    </div>
  );
}

function Row({ label, value, action }: { label: string; value: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0">
      <dt className="text-slate-400">{label}</dt>
      <dd className="flex max-w-[70%] items-center justify-end gap-2 text-right font-medium text-slate-100">
        <span className="break-all">{value}</span>
        {action}
      </dd>
    </div>
  );
}
