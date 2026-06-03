import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ActivityTimeline } from "./activity-timeline";
import { PageHeader } from "./page-header";
import { SetupProgress } from "./setup-progress";
import { StatCard } from "./stat-card";
import { DASHBOARD_STATS, RECENT_ACTIVITY, SETUP_STEPS } from "./mock-data";

export function DashboardHome() {
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
        <ActivityTimeline items={RECENT_ACTIVITY} />
        <SetupProgress progress={60} steps={SETUP_STEPS} />
      </section>
    </div>
  );
}
