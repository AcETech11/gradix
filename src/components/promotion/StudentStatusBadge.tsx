import type { StudentStatus } from "@/types/database";
import { cn } from "@/lib/utils";
import { getStudentStatusLabel } from "@/lib/promotion/student-status";

const statusClasses: Record<StudentStatus, string> = {
  active: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  inactive: "border-slate-400/20 bg-slate-500/10 text-slate-200",
  repeated: "border-sky-400/20 bg-sky-500/10 text-sky-200",
  graduated: "border-violet-400/20 bg-violet-500/10 text-violet-200",
  transferred: "border-amber-400/20 bg-amber-500/10 text-amber-200",
  withdrawn: "border-orange-400/20 bg-orange-500/10 text-orange-200",
  archived: "border-red-400/20 bg-red-500/10 text-red-200",
};

export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", statusClasses[status])}>
      {getStudentStatusLabel(status)}
    </span>
  );
}
