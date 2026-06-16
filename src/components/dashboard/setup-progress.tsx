import Link from "next/link";
import { Check, Circle } from "lucide-react";

import type { SetupStep } from "./dashboard-types";

type SetupProgressProps = {
  progress: number;
  steps: SetupStep[];
};

export function SetupProgress({ progress, steps }: SetupProgressProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)] backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Setup Completion</h2>
          <p className="text-sm text-slate-400">Operational readiness for your school workspace.</p>
        </div>
        <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-200">
          {progress}% Complete
        </span>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="mt-5 space-y-2">
        {steps.map((step) => (
          <li className="text-sm" key={step.label}>
            <Link
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-white/5"
              href={step.href ?? "/dashboard"}
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  step.complete ? "bg-emerald-500/15 text-emerald-300" : "bg-white/8 text-slate-400"
                }`}
                aria-hidden="true"
              >
                {step.complete ? <Check className="size-3.5" /> : <Circle className="size-3" />}
              </span>
              <span className={step.complete ? "text-slate-50" : "text-slate-300"}>{step.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
