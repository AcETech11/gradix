import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <section
      className={cn(
        "flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}
