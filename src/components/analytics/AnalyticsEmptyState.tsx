import { BarChart3 } from "lucide-react";

export function AnalyticsEmptyState() {
  return (
    <section className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-900/70 px-6 py-12 text-center shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)]">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-200">
        <BarChart3 className="size-6" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-slate-50">No published results yet</h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">Publish student results to unlock academic analytics.</p>
    </section>
  );
}
