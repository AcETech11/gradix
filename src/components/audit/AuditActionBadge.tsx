import type { AuditAction } from "@/types/database";
import { getAuditActionTone } from "@/lib/audit/audit-action-colors";
import { cn } from "@/lib/utils";

const toneClasses = {
  blue: "border-blue-400/25 bg-blue-500/10 text-blue-200",
  green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
  gray: "border-slate-400/25 bg-slate-500/10 text-slate-200",
  orange: "border-orange-400/25 bg-orange-500/10 text-orange-200",
  purple: "border-violet-400/25 bg-violet-500/10 text-violet-200",
  red: "border-red-400/25 bg-red-500/10 text-red-200",
};

export function AuditActionBadge({ action }: { action: AuditAction }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize", toneClasses[getAuditActionTone(action)])}>
      {action}
    </span>
  );
}
