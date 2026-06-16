import type { Metadata } from "next";
import { CheckCircle2, FileSpreadsheet, Fingerprint, MonitorCheck, Phone, ShieldCheck } from "lucide-react";

import { DemoRequestForm } from "@/components/marketing/demo-request-form";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { LandingNavbar } from "@/components/marketing/landing-navbar";

export const metadata: Metadata = {
  title: "Book a Gradix Demo — Online Result Checker for Schools",
  description: "Book a Gradix demo and see how your school can upload Excel results, publish official report cards, and let parents check results online.",
};

const showItems = [
  "How Excel result upload works",
  "How parents check results with student codes",
  "How PDF report cards look",
  "How parent access limits work",
  "How admin/headmaster controls publishing",
  "How pricing fits your school size",
];

const bestFor = [
  "Already use Excel for results",
  "Want online result checking",
  "Want official report cards",
  "Want less result-processing stress",
  "Want admin-controlled publishing",
];

const trust = [
  { label: "Private school workspace", icon: ShieldCheck },
  { label: "Published results only", icon: MonitorCheck },
  { label: "Parent access control", icon: Fingerprint },
  { label: "Official PDF reports", icon: FileSpreadsheet },
  { label: "Excel-first workflow", icon: CheckCircle2 },
];

export default function DemoPage() {
  const supportPhone = process.env.GRADIX_SUPPORT_PHONE;
  const supportEmail = process.env.GRADIX_SUPPORT_EMAIL;

  return (
    <div className="min-h-dvh bg-[#F8FAFC]">
      <LandingNavbar />
      <main>
        <section className="bg-[#070D1A] px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-orange-200">Book a Gradix demo</p>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-6xl">See how Gradix can work for your school.</h1>
              <p className="mt-6 text-lg leading-8 text-slate-300">Tell us about your school and we&apos;ll show you how Gradix can help you upload results, publish official report cards, and give parents secure online access.</p>
              <div className="mt-8 grid gap-3 text-sm font-semibold text-slate-200 sm:grid-cols-2">
                {trust.map(({ label, icon: Icon }) => <span className="flex items-center gap-2" key={label}><Icon className="size-4 text-orange-200" /> {label}</span>)}
              </div>
            </div>
            <DemoRequestForm />
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
          <InfoCard title="What we will show you" items={showItems} />
          <InfoCard title="Best for schools that" items={bestFor} />
          <div className="rounded-[1.5rem] border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="grid size-12 place-items-center rounded-2xl bg-orange-100 text-[#EA580C]"><Phone className="size-5" /></div>
            <h2 className="mt-5 text-xl font-extrabold text-[#0F172A]">Prefer to talk directly?</h2>
            {supportPhone || supportEmail ? (
              <div className="mt-4 grid gap-2 text-sm text-[#64748B]">
                {supportPhone ? <p><strong className="text-[#0F172A]">Phone:</strong> {supportPhone}</p> : null}
                {supportEmail ? <p><strong className="text-[#0F172A]">Email:</strong> {supportEmail}</p> : null}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[#64748B]">Contact the Gradix team after submitting the form.</p>
            )}
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}

function InfoCard({ items, title }: { items: string[]; title: string }) {
  return (
    <article className="rounded-[1.5rem] border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-extrabold text-[#0F172A]">{title}</h2>
      <ul className="mt-5 grid gap-3 text-sm text-[#0F172A]">
        {items.map((item) => <li className="flex gap-2" key={item}><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#16A34A]" /> {item}</li>)}
      </ul>
    </article>
  );
}
