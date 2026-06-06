import { Eye, Gauge, ShieldAlert, UserCheck, UserX } from "lucide-react";

import type { ParentAccessOverview } from "@/lib/parent-access/parent-access-types";

export function ParentAccessOverviewCards({ overview }: { overview: ParentAccessOverview }) {
  const cards = [
    { label: "Total Result Views", value: overview.totalViews, icon: Eye, tone: "text-sky-200 border-sky-400/20 bg-sky-500/10" },
    { label: "Students Checked", value: overview.studentsChecked, icon: UserCheck, tone: "text-emerald-200 border-emerald-400/20 bg-emerald-500/10" },
    { label: "Students Not Checked", value: overview.studentsNotChecked, icon: UserX, tone: "text-slate-200 border-slate-400/20 bg-slate-500/10" },
    { label: "Limit Reached", value: overview.limitReached, icon: ShieldAlert, tone: "text-orange-200 border-orange-400/20 bg-orange-500/10" },
    { label: "Active Result Codes", value: overview.activeResultCodes, icon: Gauge, tone: "text-violet-200 border-violet-400/20 bg-violet-500/10" },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <article className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)]" key={card.label}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-300">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-50">{card.value.toLocaleString()}</p>
            </div>
            <div className={`flex size-10 items-center justify-center rounded-2xl border ${card.tone}`}>
              <card.icon className="size-5" aria-hidden="true" />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
