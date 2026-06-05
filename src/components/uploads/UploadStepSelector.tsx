type UploadStepSelectorProps = {
  step: number;
};

const steps = ["Class details", "Excel upload", "Preview", "Save"];

export function UploadStepSelector({ step }: UploadStepSelectorProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {steps.map((label, index) => (
        <div
          className={
            index <= step
              ? "rounded-xl border border-orange-300/30 bg-orange-500/10 p-3 text-sm text-orange-100"
              : "rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-400"
          }
          key={label}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.12em]">Step {index + 1}</span>
          <p className="mt-1 font-medium">{label}</p>
        </div>
      ))}
    </div>
  );
}
