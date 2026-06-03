import type { ReactNode } from "react";
import { Filter, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type FilterBarProps = {
  searchPlaceholder?: string;
  actions?: ReactNode;
  disabled?: boolean;
  className?: string;
};

export function FilterBar({
  searchPlaceholder = "Search",
  actions,
  disabled = false,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 lg:flex-row lg:items-center lg:justify-between", className)}>
      <div className="relative w-full lg:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <Input
          disabled={disabled}
          placeholder={searchPlaceholder}
          className="h-11 border-white/10 bg-slate-950/40 pl-9 text-slate-100 placeholder:text-slate-500"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={disabled} type="button" variant="outline" className="gap-2 border-white/10 bg-slate-950/30 text-slate-100 hover:bg-white/10">
          <Filter className="size-4" />
          Filters
        </Button>
        {actions}
      </div>
    </div>
  );
}
