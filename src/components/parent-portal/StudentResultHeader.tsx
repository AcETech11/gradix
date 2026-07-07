import Image from "next/image";

import type { PublicResultPayload } from "@/lib/parent-portal/parent-result-types";

type StudentResultHeaderProps = {
  result: PublicResultPayload;
};

export function StudentResultHeader({ result }: StudentResultHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_30px_80px_-45px_rgba(15,23,42,0.3)]">
      <div className="border-b border-slate-100 p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {result.school.logoUrl ? (
            <Image alt={`${result.school.name} logo`} className="size-16 rounded-2xl object-cover" height={64} src={result.school.logoUrl} unoptimized width={64} />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-white">
              {result.school.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">{result.school.name}</h1>
            {result.school.address ? <p className="mt-1 text-sm leading-6 text-slate-600">{result.school.address}</p> : null}
            <p className="mt-1 text-sm text-slate-500">{[result.school.phone, result.school.email].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4">
        <Info label="Student" value={result.student.name} />
        <Info label="Result Code" value={result.student.code} />
        <Info label="Class" value={result.result.className} />
        <Info label="Term" value={`${result.result.term} term`} />
        <Info label="Academic Year" value={result.result.academicYear} />
        <Info label="Published" value={result.result.publishedAt ? new Date(result.result.publishedAt).toLocaleDateString() : "Published"} />
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold capitalize text-slate-950">{value}</p>
    </div>
  );
}
