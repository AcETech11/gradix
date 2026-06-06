import { cn } from "@/lib/utils";
import type { ParentAccessRecord } from "@/lib/parent-access/parent-access-types";

const labels: Record<ParentAccessRecord["status"], string> = {
  not_checked: "Not Checked",
  checked: "Checked",
  limit_reached: "Limit Reached",
  no_published_result: "No Published Result",
};

const classes: Record<ParentAccessRecord["status"], string> = {
  not_checked: "border-slate-500/30 bg-slate-500/10 text-slate-200",
  checked: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
  limit_reached: "border-orange-400/30 bg-orange-500/12 text-orange-200",
  no_published_result: "border-amber-400/25 bg-amber-500/10 text-amber-200",
};

export function ParentAccessStatusBadge({ status }: { status: ParentAccessRecord["status"] }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", classes[status])}>
      {labels[status]}
    </span>
  );
}
