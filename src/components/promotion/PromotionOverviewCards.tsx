import { CalendarDays, GraduationCap, School, UsersRound } from "lucide-react";

import type { PromotionOverview } from "@/lib/promotion/promotion-types";

export function PromotionOverviewCards({ overview }: { overview: PromotionOverview }) {
  const cards = [
    { label: "Current Academic Year", value: overview.currentAcademicYear, icon: CalendarDays },
    { label: "Next Academic Year", value: overview.nextAcademicYear, icon: GraduationCap },
    { label: "Active Students", value: String(overview.activeStudents), icon: UsersRound },
    { label: "Active Classes", value: String(overview.activeClasses), icon: School },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)]" key={card.label}>
          <card.icon className="size-5 text-orange-200" aria-hidden="true" />
          <p className="mt-3 text-sm text-slate-400">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-50">{card.value}</p>
        </article>
      ))}
    </section>
  );
}
