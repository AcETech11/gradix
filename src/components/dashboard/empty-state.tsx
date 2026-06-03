import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <section
      className={cn(
        "flex min-h-[22rem] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-900/70 px-6 py-10 text-center shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)] backdrop-blur",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-200">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-slate-50">{title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}
