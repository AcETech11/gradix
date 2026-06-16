"use client";

import { FileUp, GraduationCap, ShieldCheck, UsersRound } from "lucide-react";
import { motion } from "motion/react";

import type { TimelineItem } from "./dashboard-types";

type ActivityTimelineProps = {
  items: TimelineItem[];
};

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  const icons = {
    FileUp,
    ShieldCheck,
    UsersRound,
    GraduationCap,
  } as const;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)] backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Recent Activity</h2>
          <p className="text-sm text-slate-400">Recent actions across your school workspace.</p>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center">
          <p className="text-sm font-semibold text-slate-100">No recent activity yet.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
            Uploads, publishing, edits, and settings changes will appear here.
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-4">
          {items.map((item, index) => (
            <motion.li
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.25 }}
              className="flex gap-3"
              key={`${item.title}-${item.time}`}
            >
              <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-200">
                {(() => {
                  const IconComponent = icons[item.icon];

                  return <IconComponent className="size-4" aria-hidden="true" />;
                })()}
              </div>
              <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-50">{item.title}</h3>
                  <span className="text-xs text-slate-400">{item.time}</span>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-300">{item.description}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
