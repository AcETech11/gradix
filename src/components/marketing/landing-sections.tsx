"use client";

import { motion } from "motion/react";
import { BarChart3, CheckCircle2, FileSpreadsheet, Fingerprint, LockKeyhole, PenLine, RotateCcw, ScrollText, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const features = [
  { title: "Excel-first workflow", text: "Teachers fill result sheets the way they already do. Gradix handles validation, grading, publishing, and report cards.", icon: FileSpreadsheet },
  { title: "Parent result checker", text: "Parents check published results online using one permanent student code.", icon: Fingerprint },
  { title: "Official PDF reports", text: "Generate clean report cards with grades, comments, signatures, school branding, and print-ready layout.", icon: ScrollText },
  { title: "Teacher/principal signatures", text: "Upload signatures once and reuse them on official reports.", icon: PenLine },
  { title: "Parent access control", text: "Set result view limits, monitor usage, reset views, and increase access when needed.", icon: RotateCcw },
  { title: "Audit logs", text: "Track uploads, edits, publishing, settings changes, and sensitive actions.", icon: ShieldCheck },
  { title: "Analytics", text: "Understand class, subject, and student performance from published results.", icon: BarChart3 },
  { title: "Multi-school security", text: "Each school has a private workspace. No school can see another school's data.", icon: LockKeyhole },
];

const workflow = [
  ["Download Excel template", "Gradix prepares a clean class template with student codes, names, subjects, CA, exam, remarks, and comment columns."],
  ["Teachers fill scores", "Teachers continue working in Excel. They enter CA, exam scores, subject remarks, and class teacher comments."],
  ["Admin uploads and reviews", "Admin uploads the completed sheet, checks validation errors, reviews grades, and fixes mistakes before publishing."],
  ["Parents check online", "Parents use one permanent student code to view published results and print official report cards."],
];

const plans = [
  ["Starter", "₦60,000/term", "For small schools getting started.", ["Up to 300 students", "Excel result upload", "Parent result checker", "PDF report cards", "Basic branding", "Parent access reset"]],
  ["Standard", "₦90,000/term", "For growing schools that need control and insights.", ["Up to 700 students", "Everything in Starter", "Analytics dashboard", "Audit logs", "Parent access monitoring", "Teacher/principal signatures", "Custom report settings"]],
  ["Premium", "₦150,000+/term", "For larger schools needing extra support.", ["1,500+ students", "Everything in Standard", "Data migration support", "Custom report format", "Dedicated onboarding", "Priority support"]],
] as const;

export function FeatureGrid() {
  return (
    <section id="features" className="bg-[#F8FAFC] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro label="Features" title="A result management software for Nigerian schools that still respects Excel." copy="Gradix gives schools Excel result upload, an online result checker for schools, school report card software Nigeria can trust, and parent access control in one workspace." />
        <motion.div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}>
          {features.map(({ title, text, icon: Icon }) => (
            <motion.article className="group rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/10" key={title} variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}>
              <span className="grid size-11 place-items-center rounded-2xl bg-[#0B1220] text-orange-200 transition group-hover:bg-[#F97316] group-hover:text-white"><Icon className="size-5" /></span>
              <h3 className="mt-5 text-lg font-bold text-[#0F172A]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#64748B]">{text}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export function WorkflowSection() {
  return (
    <section id="workflow" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.78fr_1.22fr]">
        <SectionIntro label="How Gradix works" title="Four steps from spreadsheet to parent-ready report." copy="No generic portal training. Schools keep their existing result preparation rhythm while Gradix handles the controlled online publishing layer." />
        <div className="grid gap-4 sm:grid-cols-2">
          {workflow.map(([title, text], index) => (
            <motion.article className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl" key={title} whileHover={{ y: -5 }}>
              <span className="grid size-10 place-items-center rounded-full bg-[#F97316] font-extrabold text-white">{index + 1}</span>
              <h3 className="mt-5 text-xl font-bold text-[#0F172A]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">{text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrustSection() {
  const points = ["School data is isolated", "Published results only", "Parent access limits and resets", "Audit trail for uploads and edits"];
  return (
    <section className="bg-[#0B1220] px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr]">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-orange-200">Trust and security</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-5xl">A private result workspace for every school.</h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">Every school gets its own secure workspace. Parents only see published results. Admins control access, staff roles, result publishing, and audit trails.</p>
        </div>
        <div className="grid gap-3">
          {points.map((point) => (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 font-semibold" key={point}>
              <CheckCircle2 className="size-5 text-green-300" /> {point}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingPreview() {
  return (
    <section id="pricing" className="bg-[#F8FAFC] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionIntro label="Termly pricing" title="Plans built for real school operations." copy="One-time setup/onboarding starts from ₦50,000. No monthly pricing distraction." />
          <Button asChild className="bg-[#F97316] text-white hover:bg-[#EA580C]"><Link href="/pricing">View Pricing</Link></Button>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {plans.map(([name, price, copy, items], index) => (
            <motion.article className="relative rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl" key={name} whileHover={{ y: -5 }}>
              {index === 1 ? <span className="absolute right-5 top-5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-[#EA580C]">Recommended</span> : null}
              <h3 className="text-xl font-bold text-[#0F172A]">{name}</h3>
              <p className="mt-2 text-sm text-[#64748B]">{copy}</p>
              <p className="mt-5 text-3xl font-extrabold text-[#0F172A]">{price}</p>
              <ul className="mt-6 grid gap-3 text-sm text-[#0F172A]">
                {items.map((item) => <li className="flex gap-2" key={item}><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#16A34A]" /> {item}</li>)}
              </ul>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-[#070D1A] p-8 text-center text-white shadow-2xl shadow-slate-950/20 sm:p-12">
        <div className="mx-auto mb-6 h-1 w-32 rounded-full bg-gradient-to-r from-orange-300 via-[#F97316] to-green-300" />
        <h2 className="text-3xl font-bold sm:text-5xl">Ready to publish your next term results online?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-300">Give your school a faster, cleaner way to process results, publish report cards, and control parent access.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="h-12 bg-[#F97316] px-6 text-white hover:bg-[#EA580C]"><Link href="/demo">Book a Demo</Link></Button>
          <Button asChild className="h-12 border-white/10 bg-white/5 px-6 text-white hover:bg-white/10" variant="outline"><Link href="/pricing">View Pricing</Link></Button>
        </div>
      </div>
    </section>
  );
}

function SectionIntro({ label, title, copy }: { label: string; title: string; copy: string }) {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#F97316]">{label}</p>
      <h2 className="mt-3 text-3xl font-bold text-[#0F172A] sm:text-5xl">{title}</h2>
      <p className="mt-4 text-lg leading-8 text-[#64748B]">{copy}</p>
    </div>
  );
}
