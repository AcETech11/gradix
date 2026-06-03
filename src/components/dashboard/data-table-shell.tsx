import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DataTableShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function DataTableShell({ title, description, actions, filters, children, className }: DataTableShellProps) {
  return (
    <section className={cn("rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)] backdrop-blur", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
          {description ? <p className="max-w-2xl text-sm leading-6 text-slate-400">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {filters ? <div className="mt-4">{filters}</div> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
