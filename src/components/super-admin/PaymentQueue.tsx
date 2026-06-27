"use client";

import { useMemo, useState, useTransition } from "react";

import { approvePaymentSubmissionAction, rejectPaymentSubmissionAction, type PlatformPaymentRow } from "@/actions/super-admin/payment-actions";
import { Button } from "@/components/ui/button";

type PaymentQueueProps = {
  pendingCount: number;
  payments: PlatformPaymentRow[];
};

export function PaymentQueue({ pendingCount, payments }: PaymentQueueProps) {
  const [status, setStatus] = useState("all");
  const [school, setSchool] = useState("all");
  const [billingPeriod, setBillingPeriod] = useState("all");
  const [paymentDate, setPaymentDate] = useState("");
  const [query, setQuery] = useState("");
  const schools = useMemo(() => Array.from(new Set(payments.map((payment) => payment.schoolName))).sort(), [payments]);
  const billingPeriods = useMemo(() => Array.from(new Set(payments.map((payment) => payment.billingPeriod))).sort().reverse(), [payments]);
  const filtered = useMemo(
    () =>
      payments.filter((payment) => {
        const matchesStatus = status === "all" || payment.status === status;
        const matchesSchool = school === "all" || payment.schoolName === school;
        const matchesBillingPeriod = billingPeriod === "all" || payment.billingPeriod === billingPeriod;
        const matchesPaymentDate = !paymentDate || payment.paidAt === paymentDate;
        const haystack = [payment.schoolName, payment.paymentReference, payment.payerName, payment.bankTransferReference ?? ""].join(" ").toLowerCase();

        return matchesStatus && matchesSchool && matchesBillingPeriod && matchesPaymentDate && haystack.includes(query.toLowerCase());
      }),
    [billingPeriod, paymentDate, payments, query, school, status],
  );

  return (
    <main className="min-h-dvh bg-[#050b16] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-slate-900/75 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-orange-200">Platform Admin</p>
          <h1 className="mt-2 text-3xl font-bold">Manual payment verification</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Compare each submitted proof with the actual OPay alert or bank statement before approval.
          </p>
          <div className="mt-5 inline-flex rounded-2xl border border-orange-400/20 bg-orange-500/10 px-4 py-3 text-sm text-orange-100">
            Pending Verification: <strong className="ml-2">{pendingCount}</strong>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-slate-900/75 p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_14rem_14rem_12rem_12rem]">
            <input
              className="h-11 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-orange-400/40"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search school, reference, payer, narration"
              value={query}
            />
            <select
              className="h-11 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-orange-400/40"
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              <option value="all">All statuses</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className="h-11 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-orange-400/40"
              onChange={(event) => setSchool(event.target.value)}
              value={school}
            >
              <option value="all">All schools</option>
              {schools.map((schoolName) => (
                <option key={schoolName} value={schoolName}>
                  {schoolName}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-orange-400/40"
              onChange={(event) => setBillingPeriod(event.target.value)}
              value={billingPeriod}
            >
              <option value="all">All periods</option>
              {billingPeriods.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
            <input
              className="h-11 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-orange-400/40"
              onChange={(event) => setPaymentDate(event.target.value)}
              type="date"
              value={paymentDate}
            />
          </div>
        </section>

        <section className="grid gap-4">
          {filtered.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))}
          {filtered.length === 0 ? <div className="rounded-3xl border border-white/10 bg-slate-900/75 p-8 text-center text-slate-400">No payment submissions match this filter.</div> : null}
        </section>
      </div>
    </main>
  );
}

function PaymentCard({ payment }: { payment: PlatformPaymentRow }) {
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const canReview = payment.status === "pending_verification";

  function approve() {
    if (!window.confirm("Approve this payment and activate the school subscription?")) return;
    startTransition(async () => {
      const result = await approvePaymentSubmissionAction({ submissionId: payment.id });
      setMessage(result.message);
    });
  }

  function reject() {
    startTransition(async () => {
      const result = await rejectPaymentSubmissionAction({ submissionId: payment.id, rejectionReason: reason });
      setMessage(result.message);
    });
  }

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900/75 p-5">
      <div className="grid gap-5 xl:grid-cols-[1fr_18rem]">
        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-50">{payment.schoolName}</h2>
              <p className="mt-1 text-sm text-slate-400">{payment.schoolEmail ?? "No contact email"}</p>
            </div>
            <span className="w-fit rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold capitalize text-orange-100">
              {payment.status.replaceAll("_", " ")}
            </span>
          </div>
          <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
            <Row label="Plan" value={payment.plan} />
            <Row label="Billing period" value={payment.billingPeriod} />
            <Row label="Expected" value={`${payment.currency} ${(payment.amountExpected ?? 0).toLocaleString()}`} />
            <Row label="Amount paid" value={`${payment.currency} ${payment.amountPaid.toLocaleString()}`} />
            <Row label="Gradix reference" value={payment.paymentReference} />
            <Row label="Transfer narration/reference" value={payment.bankTransferReference ?? "Not provided"} />
            <Row label="Payer name" value={payment.payerName} />
            <Row label="Bank used" value={payment.payerBank} />
            <Row label="Payment date" value={new Date(payment.paidAt).toLocaleDateString()} />
            <Row label="Submitted" value={new Date(payment.createdAt).toLocaleString()} />
            <Row label="Current subscription" value={payment.subscriptionStatus} />
            {payment.rejectionReason ? <Row label="Rejection reason" value={payment.rejectionReason} /> : null}
          </dl>
        </div>
        <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          {payment.proofSignedUrl ? (
            <a className="block rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950 hover:bg-orange-100" href={payment.proofSignedUrl} rel="noreferrer" target="_blank">
              View Proof of Payment
            </a>
          ) : (
            <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">Proof link unavailable.</p>
          )}
          <Button className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400" disabled={!canReview || pending} onClick={approve} type="button">
            Approve Payment
          </Button>
          <textarea
            className="min-h-24 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-orange-400/40"
            disabled={!canReview || pending}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Rejection reason"
            value={reason}
          />
          <Button className="w-full border-red-400/30 bg-red-500/10 text-red-100 hover:bg-red-500/15" disabled={!canReview || pending} onClick={reject} type="button" variant="outline">
            Reject Payment
          </Button>
          {message ? <p className="text-sm text-orange-100">{message}</p> : null}
        </div>
      </div>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
      <dt className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="mt-2 break-words font-medium text-slate-100">{value}</dd>
    </div>
  );
}
