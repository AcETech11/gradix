import { BookMarked, Plus, TrendingUp, UsersRound } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { PageHeader } from "@/components/typography/page-header";
import { Button } from "@/components/ui/button";

const stats = [
  {
    label: "Active cohorts",
    value: "0",
    icon: UsersRound,
  },
  {
    label: "Tracked courses",
    value: "0",
    icon: BookMarked,
  },
  {
    label: "Progress signals",
    value: "0",
    icon: TrendingUp,
  },
] as const;

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Your Gradix workspace is ready."
        description="Phase 1 sets up the application foundation, reusable layout primitives, theme tokens, and baseline states without authentication or database tables."
        actions={
          <Button disabled>
            <Plus />
            New workspace
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3" aria-label="Workspace summary">
        {stats.map((stat) => (
          <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm" key={stat.label}>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <stat.icon className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="mt-4 text-3xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </section>

      <EmptyState
        icon={BookMarked}
        title="No learning data yet"
        description="Authentication and database-backed workflows are intentionally outside Phase 1. This space is ready for those modules when the next phase begins."
        action={
          <Button variant="outline" disabled>
            <Plus />
            Add course
          </Button>
        }
      />
    </div>
  );
}
