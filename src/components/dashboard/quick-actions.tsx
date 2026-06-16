import Link from "next/link";
import { BarChart3, Download, FileCheck2, FileSpreadsheet, UploadCloud, UserPlus } from "lucide-react";

import type { AuthRole } from "@/types/auth";

const leadershipActions = [
  {
    title: "Add Students",
    description: "Create or import learner records.",
    href: "/dashboard/students/new",
    icon: UserPlus,
    accent: "text-orange-200",
  },
  {
    title: "Download Result Template",
    description: "Prepare a class score sheet.",
    href: "/dashboard/templates",
    icon: Download,
    accent: "text-sky-200",
  },
  {
    title: "Upload Results",
    description: "Validate completed score sheets.",
    href: "/dashboard/uploads/new",
    icon: UploadCloud,
    accent: "text-emerald-200",
  },
  {
    title: "Publish Results",
    description: "Review batches and publish reports.",
    href: "/dashboard/results",
    icon: FileCheck2,
    accent: "text-orange-200",
  },
  {
    title: "Parent Checker",
    description: "Open the public result checker.",
    href: "/results",
    icon: FileSpreadsheet,
    accent: "text-sky-200",
  },
  {
    title: "View Analytics",
    description: "Track performance and access trends.",
    href: "/dashboard/analytics",
    icon: BarChart3,
    accent: "text-emerald-200",
  },
];

export function QuickActions({ role }: { role: AuthRole }) {
  if (role === "teacher") {
    return null;
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)] backdrop-blur">
      <div>
        <h2 className="text-lg font-semibold text-slate-50">Quick Actions</h2>
        <p className="text-sm leading-6 text-slate-400">Start the school tasks your team uses most.</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {leadershipActions.map((action) => (
          <Link
            className="group flex min-h-24 items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-orange-300/25 hover:bg-white/[0.07]"
            href={action.href}
            key={action.title}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/50">
              <action.icon className={`size-5 ${action.accent}`} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-50">{action.title}</span>
              <span className="mt-1 block text-sm leading-5 text-slate-400">{action.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
