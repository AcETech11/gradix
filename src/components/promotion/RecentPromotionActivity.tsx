import { formatDistanceToNow } from "date-fns";
import { History } from "lucide-react";

import type { PromotionActivity } from "@/lib/promotion/promotion-types";

export function RecentPromotionActivity({ activity }: { activity: PromotionActivity[] }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)]">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-200">
          <History className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-50">Recent promotion activity</h2>
          <p className="text-sm text-slate-400">Latest rollover and status updates.</p>
        </div>
      </div>

      {activity.length === 0 ? (
        <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
          No promotion activity yet. Student movement actions will appear here after they are saved.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {activity.map((item) => (
            <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4" key={item.id}>
              <p className="text-sm font-medium text-slate-100">{String(item.details.event ?? item.action).replace(/_/g, " ")}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {String(item.details.student_count ?? 0)} student(s) | {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
