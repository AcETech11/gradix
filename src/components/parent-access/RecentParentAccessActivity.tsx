import { formatDistanceToNow } from "date-fns";
import { Clock3 } from "lucide-react";

import { formatTerm } from "@/lib/parent-access/parent-access-formatters";
import type { ParentAccessActivity } from "@/lib/parent-access/parent-access-types";

export function RecentParentAccessActivity({ activity }: { activity: ParentAccessActivity[] }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)]">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10 text-sky-200">
          <Clock3 className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-50">Recent parent access activity</h2>
          <p className="text-sm text-slate-400">Latest successful result checks for the selected filters.</p>
        </div>
      </div>

      {activity.length === 0 ? (
        <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
          No parent result checks yet. Activity will appear after parents start checking results.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {activity.map((item) => (
            <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4" key={`${item.studentId}-${item.lastCheckedAt}`}>
              <p className="text-sm font-medium text-slate-100">
                {item.studentName}&apos;s result was checked {formatDistanceToNow(new Date(item.lastCheckedAt), { addSuffix: true })}.
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {item.className} | {formatTerm(item.term)}, {item.academicYear} | {item.useCount} total views
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
