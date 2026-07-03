import Link from "next/link";

import type { ParentTermOption } from "@/lib/parent-portal/parent-result-types";
import type { SchoolTerm } from "@/types/database";

type TermSelectorProps = {
  code: string;
  currentTerm: SchoolTerm;
  currentAcademicYear: string;
  options: ParentTermOption[];
  schoolSlug?: string | null;
};

export function TermSelector({ code, currentAcademicYear, currentTerm, options, schoolSlug }: TermSelectorProps) {
  if (options.length <= 1) {
    return null;
  }

  const basePath = schoolSlug ? `/s/${encodeURIComponent(schoolSlug)}/results` : "/results";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-950">Select term</p>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {options.map((option) => {
          const active = option.term === currentTerm && option.academicYear === currentAcademicYear;

          return (
            <Link
              className={
                active
                  ? "shrink-0 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                  : "shrink-0 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
              }
              href={`${basePath}/${encodeURIComponent(code)}?term=${option.term}&year=${encodeURIComponent(option.academicYear)}`}
              key={`${option.term}-${option.academicYear}-${option.classId}`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
