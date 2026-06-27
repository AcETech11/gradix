import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, FileDown, Sparkles } from "lucide-react";

import { getAnalyticsOverviewAction } from "@/actions/analytics/get-analytics-overview-action";
import { getAuditLogsAction } from "@/actions/audit/get-audit-logs-action";
import { Button } from "@/components/ui/button";
import { formatNumber, formatScore } from "@/lib/analytics/analytics-formatters";
import { getCurrentSchool, getCurrentUserProfile } from "@/lib/auth/session";
import type { AuthRole } from "@/types/auth";

import { ActivityTimeline } from "./activity-timeline";
import type { DashboardStat, SetupStep, TimelineItem } from "./dashboard-types";
import { PageHeader } from "./page-header";
import { QuickActions } from "./quick-actions";
import { SetupProgress } from "./setup-progress";
import { StatCard } from "./stat-card";

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

function mapAnalyticsStats(overview: Awaited<ReturnType<typeof getAnalyticsOverviewAction>>): DashboardStat[] {
  return [
    {
      label: "Total Students",
      value: formatNumber(overview.totalStudents),
      change: "Live",
      description: "Active students in this school",
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
      description: "Published result records",
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
      description: "Draft or validated uploads awaiting publishing",
      tone: overview.pendingUploads > 0 ? ("warning" as const) : ("positive" as const),
      icon: "FileUp" as const,
    },
  ];
}

function buildSetupSteps(
  overview: Awaited<ReturnType<typeof getAnalyticsOverviewAction>> | null,
  school: Awaited<ReturnType<typeof getCurrentSchool>>,
): SetupStep[] {
  const hasSchoolInfo = Boolean(school?.name && school.school_code);
  const hasClasses = Boolean(overview && overview.activeClasses > 0);
  const hasSubjects = Boolean(overview && overview.totalSubjects > 0);
  const hasStudents = Boolean(overview && overview.totalStudents > 0);
  const hasUpload = Boolean(overview && overview.pendingUploads > 0);
  const hasPublishedResult = Boolean(overview && overview.publishedResults > 0);
  const hasParentCheck = Boolean(overview && overview.parentResultChecks > 0);

  return [
    { label: "School Information", complete: hasSchoolInfo, href: "/dashboard/settings" },
    { label: "Classes Added", complete: hasClasses, href: "/onboarding" },
    { label: "Subjects Added", complete: hasSubjects, href: "/onboarding" },
    { label: "Students Added", complete: hasStudents, href: "/dashboard/students" },
    { label: "Result Template Ready", complete: hasClasses && hasSubjects && hasStudents, href: "/dashboard/templates" },
    { label: "First Result Uploaded", complete: hasUpload || hasPublishedResult, href: "/dashboard/uploads/new" },
    { label: "First Result Published", complete: hasPublishedResult, href: "/dashboard/results" },
    { label: "Parent Checker Tested", complete: hasParentCheck, href: "/results" },
  ];
}

function calculateSetupProgress(steps: SetupStep[]) {
  if (steps.length === 0) return 0;

  return Math.round((steps.filter((step) => step.complete).length / steps.length) * 100);
}

export async function DashboardHome() {
  const profile = await getCurrentUserProfile();
  const canViewLeadershipData = profile?.role === "admin" || profile?.role === "headmaster";
  const [recentAuditActivity, analyticsOverview, school] = canViewLeadershipData
    ? await Promise.all([getAuditLogsAction({}).then(mapSensitiveAuditActivity), getAnalyticsOverviewAction({}), getCurrentSchool()])
    : [[], null, await getCurrentSchool()];
  const stats = analyticsOverview ? mapAnalyticsStats(analyticsOverview) : [];
  const setupSteps = buildSetupSteps(analyticsOverview, school);
  const setupProgress = calculateSetupProgress(setupSteps);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Your school result workspace."
        description="Manage students, result uploads, published reports, parent access, analytics, and school settings from one secure workspace."
        actions={canViewLeadershipData ? (
          <>
            <Button asChild className="border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" variant="ghost">
              <Link href="/dashboard/summary/print">
                <FileDown className="size-4" />
                Download Summary
              </Link>
            </Button>
            <Button asChild className="bg-orange-500 text-slate-950 hover:bg-orange-400">
              <Link href="/onboarding">
                <Sparkles className="size-4" />
                Review onboarding
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </>
        ) : undefined}
      />

      {profile ? <QuickActions role={profile.role as AuthRole} /> : null}

      {stats.length > 0 ? (
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
      ) : null}

      {canViewLeadershipData ? (
        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <ActivityTimeline items={recentAuditActivity} />
          <SetupProgress progress={setupProgress} steps={setupSteps} />
        </section>
      ) : (
        <ActivityTimeline items={[]} />
      )}
    </div>
  );
}
