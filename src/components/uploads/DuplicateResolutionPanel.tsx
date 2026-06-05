import type { DuplicateStrategy } from "@/lib/uploads/upload-types";

type DuplicateResolutionPanelProps = {
  duplicateStrategy: DuplicateStrategy;
  duplicateCount: number;
  disabled?: boolean;
  onChange: (strategy: DuplicateStrategy) => void;
};

export function DuplicateResolutionPanel({ duplicateStrategy, duplicateCount, disabled, onChange }: DuplicateResolutionPanelProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <p className="text-sm font-medium text-slate-100">Duplicate handling</p>
      <p className="mt-1 text-sm leading-6 text-slate-400">
        {duplicateCount > 0
          ? `${duplicateCount} existing result row${duplicateCount === 1 ? "" : "s"} found for this term.`
          : "No existing results were found for the selected class and term."}
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {(["skip", "replace"] as const).map((strategy) => (
          <button
            className={
              duplicateStrategy === strategy
                ? "rounded-xl border border-orange-300/50 bg-orange-500/15 p-3 text-left text-sm text-orange-50"
                : "rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left text-sm text-slate-300 hover:bg-white/[0.06]"
            }
            disabled={disabled}
            key={strategy}
            onClick={() => onChange(strategy)}
            type="button"
          >
            <span className="font-medium capitalize">{strategy} existing</span>
            <span className="mt-1 block text-xs leading-5 text-slate-400">
              {strategy === "skip" ? "Keep existing results and save only new rows." : "Update existing unpublished results with this upload."}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
