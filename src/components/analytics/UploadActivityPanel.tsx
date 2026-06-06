import { formatDistanceToNow } from "date-fns";
import { UploadCloud } from "lucide-react";

import { TERM_LABELS, formatNumber } from "@/lib/analytics/analytics-formatters";
import type { UploadActivity } from "@/lib/analytics/analytics-types";

export function UploadActivityPanel({ data }: { data: UploadActivity }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)]">
      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10 text-sky-200">
          <UploadCloud className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Upload Activity</h2>
          <p className="mt-1 text-sm text-slate-400">Operational status for result uploads in the selected scope.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Metric label="Uploads this term" value={formatNumber(data.uploadsThisTerm)} />
        <Metric label="Published uploads" value={formatNumber(data.publishedUploads)} />
        <Metric label="Draft uploads" value={formatNumber(data.draftUploads)} />
        <Metric label="Archived uploads" value={formatNumber(data.archivedUploads)} />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <h3 className="text-sm font-semibold text-slate-50">Recent upload activity</h3>
        {data.recentUploads.length ? (
          <ul className="mt-3 space-y-3">
            {data.recentUploads.map((upload) => (
              <li className="rounded-xl bg-white/[0.03] px-3 py-3 text-sm" key={upload.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-100">{upload.className}</p>
                    <p className="text-slate-400">
                      {TERM_LABELS[upload.term]} {upload.academicYear}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold capitalize text-slate-200">{upload.status}</span>
                </div>
                <p className="mt-2 text-slate-400">{upload.fileName}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDistanceToNow(new Date(upload.uploadedAt), { addSuffix: true })}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-6 text-slate-300">No result uploads match the current filters.</p>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <strong className="mt-2 block text-lg text-slate-50">{value}</strong>
    </div>
  );
}
