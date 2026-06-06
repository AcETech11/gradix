import { formatDistanceToNow } from "date-fns";
import { AlertTriangle } from "lucide-react";

import type { FlaggedEditItem } from "@/lib/audit/audit-types";

export function FlaggedEditsPanel({ edits }: { edits: FlaggedEditItem[] }) {
  return (
    <section className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] p-5 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)]">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/10 text-amber-200">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Flagged Edits</h2>
          <p className="mt-1 text-sm leading-6 text-amber-100/90">These edits were made after results became visible to parents.</p>
        </div>
      </div>

      {edits.length ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-amber-400/15">
          <div className="hidden grid-cols-[1.1fr_1fr_0.8fr_0.8fr_1fr_0.8fr] gap-3 bg-slate-950/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-amber-100/70 lg:grid">
            <span>Student</span>
            <span>Subject</span>
            <span>Old Score</span>
            <span>New Score</span>
            <span>Edited By</span>
            <span>Edited At</span>
          </div>
          <div className="divide-y divide-amber-400/10">
            {edits.map((edit) => (
              <div className="grid gap-3 px-4 py-4 text-sm text-slate-200 lg:grid-cols-[1.1fr_1fr_0.8fr_0.8fr_1fr_0.8fr]" key={edit.id}>
                <div>
                  <span className="text-xs uppercase tracking-[0.14em] text-slate-500 lg:hidden">Student</span>
                  <p>{edit.student}</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-[0.14em] text-slate-500 lg:hidden">Subject</span>
                  <p>{edit.subject}</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-[0.14em] text-slate-500 lg:hidden">Old Score</span>
                  <p>{edit.oldScore}</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-[0.14em] text-slate-500 lg:hidden">New Score</span>
                  <p className="font-semibold text-amber-100">{edit.newScore}</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-[0.14em] text-slate-500 lg:hidden">Edited By</span>
                  <p>{edit.editedBy}</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-[0.14em] text-slate-500 lg:hidden">Edited At</span>
                  <p>{formatDistanceToNow(new Date(edit.editedAt), { addSuffix: true })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-5 text-sm text-slate-300">
          No post-publish score edits have been flagged.
        </div>
      )}
    </section>
  );
}
