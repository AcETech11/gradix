"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { ClassPerformanceRow } from "@/lib/analytics/analytics-types";
import { formatPercent, formatScore } from "@/lib/analytics/analytics-formatters";

export function ClassPerformanceChart({ rows }: { rows: ClassPerformanceRow[] }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)]">
      <div>
        <h2 className="text-lg font-semibold text-slate-50">Class Performance</h2>
        <p className="mt-1 text-sm text-slate-400">Average published result score by class.</p>
      </div>
      <div className="mt-5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="className" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip
              cursor={{ fill: "rgba(249,115,22,0.08)" }}
              contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#e2e8f0" }}
              formatter={(value) => [formatScore(Number(value)), "Average score"]}
            />
            <Bar dataKey="averageScore" fill="#f97316" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
        <div className="hidden grid-cols-[1fr_0.7fr_0.7fr_0.7fr_1fr_1fr] gap-3 bg-slate-950/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 lg:grid">
          <span>Class</span>
          <span>Students</span>
          <span>Average</span>
          <span>Pass Rate</span>
          <span>Highest Subject</span>
          <span>Lowest Subject</span>
        </div>
        <div className="divide-y divide-white/10">
          {rows.map((row) => (
            <div className="grid gap-3 px-4 py-4 text-sm text-slate-200 lg:grid-cols-[1fr_0.7fr_0.7fr_0.7fr_1fr_1fr]" key={row.classId}>
              <span className="font-medium text-slate-50">{row.className}</span>
              <span>{row.totalStudents}</span>
              <span>{formatScore(row.averageScore)}</span>
              <span>{formatPercent(row.passRate)}</span>
              <span>{row.highestAverageSubject}</span>
              <span>{row.lowestAverageSubject}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
