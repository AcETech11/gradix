import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Sparkles } from "lucide-react";

import { getAuditLogsAction } from "@/actions/audit/get-audit-logs-action";
import { Button } from "@/components/ui/button";
import { getCurrentUserProfile } from "@/lib/auth/session";

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

export async function DashboardHome() {
  const profile = await getCurrentUserProfile();
  const recentAuditActivity =
    profile?.role === "admin" || profile?.role === "headmaster" ? mapSensitiveAuditActivity(await getAuditLogsAction({})) : [];
  const activityItems = recentAuditActivity.length ? recentAuditActivity : RECENT_ACTIVITY;

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
        {DASHBOARD_STATS.map((stat) => (
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
