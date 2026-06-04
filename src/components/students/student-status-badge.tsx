import type { StudentStatus } from "@/types/students";
import { cn } from "@/lib/utils";
import { getStudentStatusLabel } from "@/lib/students/utils";

type StudentStatusBadgeProps = {
  status: StudentStatus;
  className?: string;
};

const statusClasses: Record<StudentStatus, string> = {
  active: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  inactive: "border-slate-400/20 bg-slate-500/10 text-slate-300",
  graduated: "border-sky-400/20 bg-sky-500/10 text-sky-200",
  archived: "border-orange-400/20 bg-orange-500/10 text-orange-200",
};

export function StudentStatusBadge({ status, className }: StudentStatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", statusClasses[status], className)}>
      {getStudentStatusLabel(status)}
    </span>
  );
}
