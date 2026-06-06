import { BarChart3, Clock, Fingerprint, GraduationCap, School, UsersRound } from "lucide-react";

import { AnalyticsMetricCard } from "@/components/analytics/AnalyticsMetricCard";
import { formatNumber, formatScore } from "@/lib/analytics/analytics-formatters";
import type { AnalyticsOverview } from "@/lib/analytics/analytics-types";

export function AnalyticsOverviewCards({ overview }: { overview: AnalyticsOverview }) {
  const cards = [
    {
      label: "Total Students",
      value: formatNumber(overview.totalStudents),
      description: "Active student records in this school workspace.",
      icon: UsersRound,
    },
    {
      label: "Active Classes",
      value: formatNumber(overview.activeClasses),
      description: "Classes currently available for reporting.",
      icon: School,
    },
    {
      label: "Published Results",
      value: formatNumber(overview.publishedResults),
      description: "Published subject result rows in the selected scope.",
      icon: GraduationCap,
    },
    {
      label: "Pending Uploads",
      value: formatNumber(overview.pendingUploads),
      description: "Draft, validating, or validated uploads awaiting closure.",
      icon: Clock,
    },
    {
      label: "Parent Result Checks",
      value: formatNumber(overview.parentResultChecks),
      description: "Total verified result-code uses recorded so far.",
      icon: Fingerprint,
    },
    {
      label: "Average Score",
      value: formatScore(overview.averageScore),
      description: "Mean score from published results only.",
      icon: BarChart3,
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Analytics overview">
      {cards.map((card) => (
        <AnalyticsMetricCard {...card} key={card.label} />
      ))}
    </section>
  );
}
