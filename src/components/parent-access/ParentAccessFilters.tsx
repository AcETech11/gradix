"use client";

import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { ParentAccessClassOption, ParentAccessStatus } from "@/lib/parent-access/parent-access-types";
import { formatTerm } from "@/lib/parent-access/parent-access-formatters";
import type { SchoolTerm } from "@/types/database";

type ParentAccessFiltersProps = {
  academicYears: string[];
  classOptions: ParentAccessClassOption[];
  termOptions: SchoolTerm[];
  values: {
    academicYear?: string;
    term?: SchoolTerm;
    classId?: string;
    status: ParentAccessStatus;
  };
};

export function ParentAccessFilters({ academicYears, classOptions, termOptions, values }: ParentAccessFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(name: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());

    if (value === "all" || value === "") {
      next.delete(name);
    } else {
      next.set(name, value);
    }

    router.replace(`/dashboard/parent-access?${next.toString()}`);
  }

  return (
    <section className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/75 p-4 md:grid-cols-4">
      <Filter label="Academic Year">
        <select className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none focus:border-orange-300" value={values.academicYear ?? ""} onChange={(event) => setFilter("academicYear", event.target.value)}>
          {academicYears.length === 0 ? <option value="">No years</option> : null}
          {academicYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </Filter>
      <Filter label="Term">
        <select className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none focus:border-orange-300" value={values.term ?? ""} onChange={(event) => setFilter("term", event.target.value)}>
          {termOptions.length === 0 ? <option value="">No terms</option> : null}
          {termOptions.map((term) => (
            <option key={term} value={term}>
              {formatTerm(term)}
            </option>
          ))}
        </select>
      </Filter>
      <Filter label="Class">
        <select className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none focus:border-orange-300" value={values.classId ?? "all"} onChange={(event) => setFilter("classId", event.target.value)}>
          <option value="all">All classes</option>
          {classOptions.map((schoolClass) => (
            <option key={schoolClass.id} value={schoolClass.id}>
              {schoolClass.name}
            </option>
          ))}
        </select>
      </Filter>
      <Filter label="Status">
        <select className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none focus:border-orange-300" value={values.status} onChange={(event) => setFilter("status", event.target.value)}>
          <option value="all">All</option>
          <option value="not_checked">Not Checked</option>
          <option value="checked">Checked</option>
          <option value="limit_reached">Limit Reached</option>
          <option value="no_published_result">No Published Result</option>
        </select>
      </Filter>
    </section>
  );
}

function Filter({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</span>
      {children}
    </label>
  );
}
