"use client";

import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { PromotionClassOption } from "@/lib/promotion/promotion-types";

type PromotionFiltersProps = {
  classes: PromotionClassOption[];
  selected: {
    fromAcademicYear: string;
    toAcademicYear: string;
    fromClassId: string;
    toClassId: string;
  };
};

export function PromotionFilters({ classes, selected }: PromotionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const years = Array.from(new Set(classes.map((schoolClass) => schoolClass.academicYear))).sort().reverse();
  const inputClass = "h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none focus:border-orange-300";

  function setFilter(name: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());

    if (value) {
      next.set(name, value);
    } else {
      next.delete(name);
    }

    router.replace(`/dashboard/promotion?${next.toString()}`);
  }

  return (
    <section className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/75 p-4 lg:grid-cols-4">
      <Field label="From academic year">
        <select className={inputClass} value={selected.fromAcademicYear} onChange={(event) => setFilter("fromAcademicYear", event.target.value)}>
          {years.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
      </Field>
      <Field label="From class">
        <select className={inputClass} value={selected.fromClassId} onChange={(event) => setFilter("fromClassId", event.target.value)}>
          <option value="">Select class</option>
          {classes.filter((schoolClass) => schoolClass.academicYear === selected.fromAcademicYear).map((schoolClass) => (
            <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name} ({schoolClass.studentCount})</option>
          ))}
        </select>
      </Field>
      <Field label="To academic year">
        <input className={inputClass} value={selected.toAcademicYear} onChange={(event) => setFilter("toAcademicYear", event.target.value)} />
      </Field>
      <Field label="To class">
        <select className={inputClass} value={selected.toClassId} onChange={(event) => setFilter("toClassId", event.target.value)}>
          <option value="">Select target class</option>
          {classes.map((schoolClass) => (
            <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name} - {schoolClass.academicYear}</option>
          ))}
        </select>
      </Field>
    </section>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</span>
      {children}
    </label>
  );
}
