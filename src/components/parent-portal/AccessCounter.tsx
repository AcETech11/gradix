type AccessCounterProps = {
  useCount: number;
  maxUses: number;
  remaining: number;
};

export function AccessCounter({ maxUses, remaining, useCount }: AccessCounterProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-950">Access counter</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        View {useCount} of {maxUses} this term. {remaining} views remaining this term.
      </p>
    </section>
  );
}
