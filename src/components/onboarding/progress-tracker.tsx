type ProgressTrackerProps = {
  currentStep: number;
  totalSteps: number;
};

export function ProgressTracker({ currentStep, totalSteps }: ProgressTrackerProps) {
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">Setup progress</span>
        <span className="font-semibold text-orange-600">{progress}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-orange-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
