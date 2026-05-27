import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

export function AppShell({ children, className }: AppShellProps) {
  return <div className={cn("min-h-dvh bg-background text-foreground", className)}>{children}</div>;
}
