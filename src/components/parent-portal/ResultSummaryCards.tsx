import { Award, BarChart3, BookOpenCheck, TrendingDown, TrendingUp } from "lucide-react";

import { calculateResultSummary } from "@/lib/parent-portal/calculate-result-summary";
import type { ParentResultRow } from "@/lib/parent-portal/parent-result-types";
import { formatPositionOutOf } from "@/lib/results/calculate-positions";
import { getScoreInkClassName } from "@/lib/results/score-ink";
import { cn } from "@/lib/utils";

export function ResultSummaryCards({
  rows,
  overallPosition,
  classStudentCount,
}: {
  rows: ParentResultRow[];
  overallPosition?: number | null;
  classStudentCount?: number | null;
}) {
  const summary = calculateResultSummary(rows);
  const cards = [
    { label: "Total score", value: summary.totalScore.toFixed(1), icon: BarChart3 },
    { label: "Average", value: summary.averageScore.toFixed(1), icon: Award },
    { label: "Subjects", value: String(summary.subjectCount), icon: BookOpenCheck },
    { label: "Overall grade", value: summary.overallGrade, icon: Award },
    { label: "Overall position", value: formatPositionOutOf(overallPosition, classStudentCount), icon: Award },
    { label: "Highest", value: summary.highestSubject ? `${summary.highestSubject.subject} (${summary.highestSubject.total})` : "N/A", icon: TrendingUp },
    { label: "Lowest", value: summary.lowestSubject ? `${summary.lowestSubject.subject} (${summary.lowestSubject.total})` : "N/A", icon: TrendingDown },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" key={card.label}>
          <card.icon className="size-5 text-emerald-700" />
          <p className="mt-3 text-sm text-slate-500">{card.label}</p>
          <p className={cn("mt-1 text-xl font-semibold text-slate-950", card.label === "Average" && getScoreInkClassName(summary.averageScore))}>{card.value}</p>
        </div>
      ))}
    </section>
  );
}
