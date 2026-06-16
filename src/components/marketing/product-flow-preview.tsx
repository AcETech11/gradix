"use client";

import { motion } from "motion/react";
import { ArrowDown, CheckCircle2, FileSpreadsheet, Fingerprint, Send } from "lucide-react";

const items = [
  { title: "Excel Upload", text: "Teachers submit familiar spreadsheets.", icon: FileSpreadsheet },
  { title: "Validate Results", text: "Gradix checks scores, subjects, and student codes.", icon: CheckCircle2 },
  { title: "Publish Report", text: "Admins publish official report cards.", icon: Send },
  { title: "Parents Check Online", text: "Parents use one permanent code.", icon: Fingerprint },
];

export function ProductFlowPreview() {
  return (
    <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#F97316]">Controlled workflow</p>
          <h2 className="mt-3 text-3xl font-bold text-[#0F172A] sm:text-5xl">From Excel sheet to published report card in one controlled workflow.</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {items.map(({ title, text, icon: Icon }, index) => (
            <motion.article className="relative rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl" key={title} whileHover={{ y: -5 }}>
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#0B1220] text-orange-200"><Icon className="size-5" /></span>
              <h3 className="mt-4 text-lg font-bold text-[#0F172A]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">{text}</p>
              {index < items.length - 1 ? <ArrowDown className="mx-auto mt-4 size-5 text-[#F97316] md:absolute md:-right-3 md:top-1/2 md:mt-0 md:-rotate-90" /> : null}
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
