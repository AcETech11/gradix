"use client";

import { BookOpenText, FileUp, GraduationCap, ShieldCheck, UsersRound } from "lucide-react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  change: string;
  description: string;
  icon: "UsersRound" | "BookOpenText" | "ShieldCheck" | "GraduationCap" | "FileUp";
  tone: "positive" | "warning" | "neutral";
};

const toneClasses: Record<StatCardProps["tone"], string> = {
  positive: "border-emerald-400/20 bg-emerald-500/8 text-emerald-200",
  warning: "border-orange-400/20 bg-orange-500/10 text-orange-200",
  neutral: "border-sky-400/20 bg-sky-500/8 text-sky-200",
};

const icons = {
  UsersRound,
  BookOpenText,
  ShieldCheck,
  GraduationCap,
  FileUp,
} as const;

export function StatCard({ label, value, change, description, icon: Icon, tone }: StatCardProps) {
  const IconComponent = icons[Icon];

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)] backdrop-blur"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-300">{label}</p>
          <p className="text-3xl font-semibold tracking-tight text-slate-50">{value}</p>
        </div>
        <div className={cn("flex size-11 items-center justify-center rounded-2xl border", toneClasses[tone])}>
          <IconComponent className="size-5" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-200">
          {change}
        </span>
        <p className="text-xs leading-5 text-slate-400">{description}</p>
      </div>
    </motion.article>
  );
}
