import { formatDistanceToNow } from "date-fns";
import { Fingerprint } from "lucide-react";

import { formatNumber } from "@/lib/analytics/analytics-formatters";
import type { ParentAccessAnalytics } from "@/lib/analytics/analytics-types";

export function ParentAccessInsights({ data }: { data: ParentAccessAnalytics }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)]">
      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-200">
          <Fingerprint className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Parent Access Insights</h2>
          <p className="mt-1 text-sm text-slate-400">Result-code usage and parent visibility signals.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Metric label="Total result views" value={formatNumber(data.totalViews)} />
        <Metric label="Unique students checked" value={formatNumber(data.uniqueStudentsChecked)} />
        <Metric label="Most checked class" value={data.mostCheckedClass} />
        <Metric label="Codes at limit" value={formatNumber(data.codesAtLimit)} />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <h3 className="text-sm font-semibold text-slate-50">Recent parent checks</h3>
        {data.recentChecks.length ? (
          <ul className="mt-3 space-y-3">
            {data.recentChecks.map((check) => (
              <li className="flex items-start justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-3 text-sm" key={check.id}>
                <div>
                  <p className="font-medium text-slate-100">{check.studentName}</p>
                  <p className="text-slate-400">{check.className}</p>
                </div>
                <div className="text-right text-slate-400">
                  <p>{formatDistanceToNow(new Date(check.usedAt), { addSuffix: true })}</p>
                  <p>{check.useCount} checks</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-6 text-slate-300">No parent result checks yet. Parent access insights will appear after parents start checking results.</p>
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
