import { CreditCard } from "lucide-react";

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
              To renew your Gradix subscription, make payment to the provided account and contact Gradix support for activation.
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
      <section className="grid gap-5 lg:grid-cols-2">
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
          <h2 className="font-semibold text-slate-50">Payment instructions</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <Row label="Bank" value={process.env.GRADIX_BANK_NAME ?? "Contact Gradix support"} />
            <Row label="Account name" value={process.env.GRADIX_ACCOUNT_NAME ?? "Contact Gradix support"} />
            <Row label="Account number" value={process.env.GRADIX_ACCOUNT_NUMBER ?? "Contact Gradix support"} />
            <Row label="Support phone" value={process.env.GRADIX_SUPPORT_PHONE ?? "Not configured"} />
            <Row label="Support email" value={process.env.GRADIX_SUPPORT_EMAIL ?? "Not configured"} />
          </dl>
        </div>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-slate-100">{value}</dd>
    </div>
  );
}
