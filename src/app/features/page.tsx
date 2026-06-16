import type { Metadata } from "next";

import { MarketingSection, MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Gradix Features - Excel Result Upload, Report Cards & Parent Result Checker",
  description: "Explore Gradix features for Excel result upload for schools, official report cards, parent result checker, access control, analytics, and audit logs.",
};

const features = [
  ["Excel result upload for schools", "Download class templates, collect completed Excel files from teachers, validate scores, and publish without changing the school's workflow."],
  ["School report card software Nigeria", "Generate official report cards with branding, grading guide, score indicators, teacher comments, and signatures."],
  ["Parent result checker", "Parents use one permanent student code to access published results securely."],
  ["Parent access monitoring", "Set result view limits, reset access counts, and monitor result checks."],
  ["Analytics and audit logs", "Understand performance trends and keep accountability around uploads, publishing, edits, and settings changes."],
  ["Multi-school secure workspace", "Every school has its own private tenant and school-scoped data access."],
];

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <MarketingSection>
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-600">Features</p>
          <h1 className="mt-4 text-4xl font-extrabold text-[#071225] sm:text-5xl">A school portal for result checking that still respects the Excel workflow teachers know.</h1>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {features.map(([title, description]) => (
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-950/5" key={title}>
              <h2 className="text-xl font-extrabold text-[#071225]">{title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </MarketingSection>
    </MarketingShell>
  );
}
