import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Sparkles } from "lucide-react";

import { getAnalyticsOverviewAction } from "@/actions/analytics/get-analytics-overview-action";
import { getAuditLogsAction } from "@/actions/audit/get-audit-logs-action";
import { Button } from "@/components/ui/button";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { formatNumber, formatScore } from "@/lib/analytics/analytics-formatters";

import { ActivityTimeline } from "./activity-timeline";
import { PageHeader } from "./page-header";
import { SetupProgress } from "./setup-progress";
import { StatCard } from "./stat-card";
import { DASHBOARD_STATS, RECENT_ACTIVITY, SETUP_STEPS, type TimelineItem } from "./mock-data";

function mapSensitiveAuditActivity(logs: Awaited<ReturnType<typeof getAuditLogsAction>>): TimelineItem[] {
  return logs
    .filter((log) => {
      if (log.entity === "results" && log.action === "update") {
        return true;
      }

      if (log.entity === "result_uploads" && (log.action === "publish" || log.action === "unpublish")) {
        return true;
      }

      return log.entity === "students" && log.action === "delete";
    })
    .slice(0, 5)
    .map((log) => ({
      title: log.summary,
      description: `${log.actor.name} performed a ${log.action} action on ${log.entity.replace(/_/g, " ")}.`,
      time: formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }),
      icon: log.entity === "students" ? "UsersRound" : log.entity === "results" ? "GraduationCap" : "ShieldCheck",
    }));
}

function mapAnalyticsStats(overview: Awaited<ReturnType<typeof getAnalyticsOverviewAction>>) {
  return [
    {
      label: "Total Students",
      value: formatNumber(overview.totalStudents),
      change: "Live",
      description: "Active students in this school workspace",
      tone: "neutral" as const,
      icon: "UsersRound" as const,
    },
    {
      label: "Active Classes",
      value: formatNumber(overview.activeClasses),
      change: "Live",
      description: "Classes currently configured",
      tone: "neutral" as const,
      icon: "BookOpenText" as const,
    },
    {
      label: "Published Results",
      value: formatNumber(overview.publishedResults),
      change: formatScore(overview.averageScore),
      description: "Published rows and average score",
      tone: "positive" as const,
      icon: "ShieldCheck" as const,
    },
    {
      label: "Parent Result Checks",
      value: formatNumber(overview.parentResultChecks),
      change: "Verified",
      description: "Result-code usage recorded",
      tone: "neutral" as const,
      icon: "GraduationCap" as const,
    },
    {
      label: "Pending Uploads",
      value: formatNumber(overview.pendingUploads),
      change: "Open",
      description: "Draft or validated uploads awaiting closure",
      tone: overview.pendingUploads > 0 ? ("warning" as const) : ("positive" as const),
      icon: "FileUp" as const,
    },
  ];
}

export async function DashboardHome() {
  const profile = await getCurrentUserProfile();
  const canViewLeadershipData = profile?.role === "admin" || profile?.role === "headmaster";
  const [recentAuditActivity, analyticsOverview] = canViewLeadershipData
    ? await Promise.all([getAuditLogsAction({}).then(mapSensitiveAuditActivity), getAnalyticsOverviewAction({})])
    : [[], null];
  const activityItems = recentAuditActivity.length ? recentAuditActivity : RECENT_ACTIVITY;
  const stats = analyticsOverview ? mapAnalyticsStats(analyticsOverview) : DASHBOARD_STATS;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="A polished control room for Gradix."
        description="This dashboard shell is ready for the school, student, upload, result, and portal modules that will plug in later."
        actions={
          <Button asChild className="bg-orange-500 text-slate-950 hover:bg-orange-400">
            <Link href="/onboarding">
              <Sparkles className="size-4" />
              Review onboarding
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Dashboard summary">
        {stats.map((stat) => (
          <StatCard
            change={stat.change}
            description={stat.description}
            icon={stat.icon}
            key={stat.label}
            label={stat.label}
            tone={stat.tone}
            value={stat.value}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <ActivityTimeline items={activityItems} />
        <SetupProgress progress={60} steps={SETUP_STEPS} />
      </section>
    </div>
  );
}
