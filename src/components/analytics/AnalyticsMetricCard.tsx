import type { LucideIcon } from "lucide-react";

type AnalyticsMetricCardProps = {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
};

export function AnalyticsMetricCard({ label, value, description, icon: Icon }: AnalyticsMetricCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <strong className="mt-2 block text-2xl font-semibold text-slate-50">{value}</strong>
        </div>
        <div className="flex size-11 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-200">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">{description}</p>
    </article>
  );
}
