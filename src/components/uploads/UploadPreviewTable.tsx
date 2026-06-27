"use client";

import { useMemo, useState } from "react";

import type { UploadPreviewRow, UploadPreviewStatus } from "@/lib/uploads/upload-types";

type UploadPreviewTableProps = {
  rows: UploadPreviewRow[];
};

const statusStyles: Record<UploadPreviewStatus, string> = {
  valid: "border-emerald-300/20 bg-emerald-500/10 text-emerald-100",
  warning: "border-orange-300/20 bg-orange-500/10 text-orange-100",
  duplicate: "border-sky-300/20 bg-sky-500/10 text-sky-100",
  invalid: "border-red-300/20 bg-red-500/10 text-red-100",
};

function formatRatings(ratings: Record<string, number | undefined>) {
  const entries = Object.entries(ratings).filter(([, rating]) => rating !== undefined);

  return entries.length ? entries.map(([trait, rating]) => `${trait}: ${rating}`).join("; ") : "";
}

export function UploadPreviewTable({ rows }: UploadPreviewTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | UploadPreviewStatus>("all");
  const [errorsOnly, setErrorsOnly] = useState(false);
  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const matchesSearch = [row.studentCode, row.studentName, row.admissionNumber, row.subjectName]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesStatus = status === "all" || row.status === status;
        const matchesErrors = !errorsOnly || row.errors.length > 0;

        return matchesSearch && matchesStatus && matchesErrors;
      }),
    [errorsOnly, rows, search, status],
  );

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Preview normalized result rows</h2>
          <p className="text-sm text-slate-400">One Excel student row becomes one result row per assigned subject.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="h-10 rounded-md border border-white/10 bg-slate-900 px-3 text-sm text-slate-50 outline-none focus:border-orange-300"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search preview"
            value={search}
          />
          <select
            className="h-10 rounded-md border border-white/10 bg-slate-900 px-3 text-sm text-slate-50 outline-none focus:border-orange-300"
            onChange={(event) => setStatus(event.target.value as "all" | UploadPreviewStatus)}
            value={status}
          >
            <option value="all">All statuses</option>
            <option value="valid">Valid</option>
            <option value="warning">Warning</option>
            <option value="duplicate">Duplicate</option>
            <option value="invalid">Invalid</option>
          </select>
          <label className="flex h-10 items-center gap-2 rounded-md border border-white/10 bg-slate-900 px-3 text-sm text-slate-200">
            <input checked={errorsOnly} onChange={(event) => setErrorsOnly(event.target.checked)} type="checkbox" />
            Errors only
          </label>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[86rem] w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-slate-400">
            <tr className="border-b border-white/10">
              {["Status", "Student Code", "Student Name", "Admission Number", "Subject", "CA", "Exam", "Total", "Grade", "Attendance", "Domains", "Remark", "Errors"].map(
                (header) => (
                  <th className="px-3 py-3 font-medium" key={header}>
                    {header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr className="border-b border-white/5 text-slate-200" key={row.rowId}>
                <td className="px-3 py-3">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[row.status]}`}>{row.status}</span>
                </td>
                <td className="px-3 py-3 font-mono text-xs">{row.studentCode}</td>
                <td className="px-3 py-3">{row.studentName}</td>
                <td className="px-3 py-3">{row.admissionNumber || "N/A"}</td>
                <td className="px-3 py-3">{row.subjectName}</td>
                <td className="px-3 py-3">{row.ca ?? "-"}</td>
                <td className="px-3 py-3">{row.exam ?? "-"}</td>
                <td className="px-3 py-3">{row.total ?? "-"}</td>
                <td className="px-3 py-3">{row.grade}</td>
                <td className="px-3 py-3">
                  {row.attendancePresent !== null || row.attendanceAbsent !== null ? `${row.attendancePresent ?? "-"} present / ${row.attendanceAbsent ?? "-"} absent` : "-"}
                </td>
                <td className="px-3 py-3">
                  {[formatRatings(row.affectiveDomain), formatRatings(row.psychomotorDomain)].filter(Boolean).join(" | ") || "-"}
                </td>
                <td className="px-3 py-3">{row.remark || "-"}</td>
                <td className="max-w-80 px-3 py-3 text-xs leading-5 text-red-200">
                  {[...row.errors, ...row.warnings].join(" ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
