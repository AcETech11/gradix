import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CheckCircle2, HelpCircle } from "lucide-react";

import { LandingFooter } from "@/components/marketing/landing-footer";
import { LandingNavbar } from "@/components/marketing/landing-navbar";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Gradix Pricing — School Result Management Software in Nigeria",
  description: "Simple termly pricing for Nigerian schools to upload Excel results, publish report cards online, and let parents check results with one permanent student code.",
};

const plans = [
  {
    name: "Starter",
    price: "₦60,000 / term",
    subtitle: "For small schools getting started.",
    limit: "Up to 300 students",
    cta: "Book Starter Demo",
    features: ["Excel result upload", "Parent result checker", "PDF report cards", "Basic school branding", "Parent access limit/reset", "Student records", "Template download", "Email/WhatsApp support"],
  },
  {
    name: "Standard",
    price: "₦90,000 / term",
    subtitle: "For growing schools that need control and insights.",
    limit: "Up to 700 students",
    cta: "Book Standard Demo",
    badge: "Recommended",
    features: ["Everything in Starter", "Analytics dashboard", "Audit logs", "Parent access monitoring", "Custom report card settings", "Teacher/principal signatures", "Class teacher comments", "Priority setup support"],
  },
  {
    name: "Premium",
    price: "₦150,000+ / term",
    subtitle: "For larger schools that need capacity and custom support.",
    limit: "1,500+ students",
    cta: "Talk to Us",
    features: ["Everything in Standard", "Larger student capacity", "Data migration support", "Custom report format support", "Dedicated onboarding", "Priority support", "Advanced customization discussion"],
  },
];

const comparison = [
  ["Student limit", "300", "700", "1,500+"],
  ["Excel upload", "Yes", "Yes", "Yes"],
  ["Parent result checker", "Yes", "Yes", "Yes"],
  ["PDF report cards", "Yes", "Yes", "Yes"],
  ["Parent access control", "Basic", "Advanced", "Advanced"],
  ["Branding", "Basic", "Custom", "Custom"],
  ["Analytics", "No", "Yes", "Yes"],
  ["Audit logs", "No", "Yes", "Yes"],
  ["Teacher/principal signatures", "No", "Yes", "Yes"],
  ["Custom report settings", "No", "Yes", "Advanced"],
  ["Priority support", "No", "Setup", "Yes"],
];

const faqs = [
  ["Do teachers need to log in?", "No. Teachers can fill Excel templates and send them back to the admin/headmaster. Teacher accounts are optional."],
  ["Do parents need a new code every term?", "No. Each student can use one permanent student code across terms."],
  ["Can we control how many times parents view results?", "Yes. Schools can set view limits, monitor usage, reset views, and increase access when needed."],
  ["Can Gradix print official report cards?", "Yes. Gradix generates official report cards with school branding, grades, teacher comments, and signatures."],
  ["Is setup included?", "A one-time setup/onboarding fee starts from ₦50,000. It covers configuration, branding guidance, and admin training."],
  ["Can we start with one term?", "Yes. Schools can start with one academic term and renew as needed."],
  ["Is Gradix a full school ERP?", "No. Gradix is focused on result processing, report cards, parent checking, analytics, audit logs, and access control."],
  ["Can one school see another school data?", "No. Each school has its own private workspace."],
];

export default function PricingPage() {
  return (
    <div className="min-h-dvh bg-[#F8FAFC]">
      <LandingNavbar />
      <main>
        <section className="bg-[#070D1A] px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-orange-200">Simple termly pricing</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-tight sm:text-6xl">Choose the Gradix plan that fits your school.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">Start with Excel result upload, parent result checking, official report cards, and access control. Upgrade when your school needs analytics, audit logs, and more support.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-12 bg-[#F97316] text-white hover:bg-[#EA580C]"><Link href="/demo">Book a Demo</Link></Button>
              <Button asChild className="h-12 border-white/10 bg-white/5 text-white hover:bg-white/10" variant="outline"><a href="#compare">Compare Plans</a></Button>
            </div>
            <p className="mt-5 text-sm text-slate-400">Schools usually pay per academic term. One-time setup/onboarding starts from ₦50,000.</p>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <article className="relative rounded-[1.75rem] border border-[#E2E8F0] bg-white p-6 shadow-xl shadow-slate-950/5" key={plan.name}>
                {plan.badge ? <span className="absolute right-5 top-5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-[#EA580C]">{plan.badge}</span> : null}
                <h2 className="text-2xl font-extrabold text-[#0F172A]">{plan.name}</h2>
                <p className="mt-2 text-sm text-[#64748B]">{plan.subtitle}</p>
                <p className="mt-5 text-4xl font-extrabold text-[#0F172A]">{plan.price}</p>
                <p className="mt-2 font-semibold text-[#2563EB]">{plan.limit}</p>
                <ul className="mt-6 grid gap-3 text-sm text-[#0F172A]">
                  {plan.features.map((feature) => <li className="flex gap-2" key={feature}><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#16A34A]" /> {feature}</li>)}
                </ul>
                <Button asChild className="mt-7 h-11 w-full bg-[#F97316] text-white hover:bg-[#EA580C]"><Link href="/demo">{plan.cta}</Link></Button>
              </article>
            ))}
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-orange-200 bg-orange-50 p-5 text-[#0F172A]">
            <h2 className="font-extrabold">One-time setup/onboarding starts from ₦50,000.</h2>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">Setup covers school workspace setup, branding, student/class setup guidance, admin training, and first result publishing support.</p>
          </div>
        </section>
        <section id="compare" className="bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-3xl font-extrabold text-[#0F172A]">Compare plans</h2>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-[#E2E8F0]">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="bg-[#0B1220] text-white"><tr>{["Feature", "Starter", "Standard", "Premium"].map((h) => <th className="px-4 py-3" key={h}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">{comparison.map((row) => <tr key={row[0]}>{row.map((cell) => <td className="px-4 py-3" key={cell}>{cell}</td>)}</tr>)}</tbody>
              </table>
            </div>
          </div>
        </section>
        <section className="bg-[#F8FAFC] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.8fr_1.2fr]">
            <div><CalendarDays className="size-10 text-[#F97316]" /><h2 className="mt-4 text-3xl font-extrabold text-[#0F172A]">Built around the school calendar.</h2><p className="mt-4 leading-7 text-[#64748B]">Gradix pricing is termly because schools process and publish results by academic term. You only pay for the period your school uses for result publishing and parent access.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">{["Works naturally with First, Second, and Third Term", "Easier for school budgeting", "No confusing scratch-card setup", "Parents keep one permanent student code"].map((point) => <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 font-semibold text-[#0F172A]" key={point}>{point}</div>)}</div>
          </div>
        </section>
        <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl font-extrabold text-[#0F172A]">Questions schools ask before paying</h2>
            <div className="mt-6 grid gap-3">{faqs.map(([question, answer]) => <details className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4" key={question}><summary className="flex cursor-pointer items-center gap-2 font-bold text-[#0F172A]"><HelpCircle className="size-4 text-[#F97316]" />{question}</summary><p className="mt-3 leading-7 text-[#64748B]">{answer}</p></details>)}</div>
          </div>
        </section>
        <section className="bg-[#070D1A] px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center"><h2 className="text-3xl font-extrabold sm:text-5xl">Ready to publish your next term results online?</h2><p className="mx-auto mt-4 max-w-2xl text-slate-300">Book a short demo and see how Gradix can fit your school&apos;s current result workflow.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild className="bg-[#F97316] text-white hover:bg-[#EA580C]"><Link href="/demo">Book a Demo</Link></Button><Button asChild className="border-white/10 bg-white/5 text-white hover:bg-white/10" variant="outline"><Link href="/">Go Home</Link></Button></div></div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
