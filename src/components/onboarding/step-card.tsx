import type { ReactNode } from "react";

type StepCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function StepCard({ eyebrow, title, description, children }: StepCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/10 sm:p-7">
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
      </div>
      {children}
    </section>
  );
}
