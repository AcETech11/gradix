"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { GradeDistributionItem } from "@/lib/analytics/analytics-types";

const colors: Record<GradeDistributionItem["grade"], string> = {
  A: "#22c55e",
  B: "#38bdf8",
  C: "#f59e0b",
  D: "#f97316",
  F: "#ef4444",
};

export function GradeDistributionChart({ items }: { items: GradeDistributionItem[] }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)]">
      <div>
        <h2 className="text-lg font-semibold text-slate-50">Grade Distribution</h2>
        <p className="mt-1 text-sm text-slate-400">A: 70-100, B: 60-69, C: 50-59, D: 40-49, F: 0-39.</p>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-[1fr_0.8fr] md:items-center">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={items} dataKey="count" nameKey="grade" innerRadius={55} outerRadius={92} paddingAngle={3}>
                {items.map((item) => (
                  <Cell key={item.grade} fill={colors[item.grade]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#e2e8f0" }}
                formatter={(value) => [value, "Results"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3" key={item.grade}>
              <div className="flex items-center gap-3">
                <span className="size-3 rounded-full" style={{ background: colors[item.grade] }} />
                <span className="font-semibold text-slate-100">Grade {item.grade}</span>
              </div>
              <span className="text-sm text-slate-300">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
