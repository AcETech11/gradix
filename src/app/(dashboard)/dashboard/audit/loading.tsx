import { TableSkeleton } from "@/components/dashboard/loading-state";

export default function AuditLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-3 w-20 rounded-full bg-orange-300/20" />
        <div className="h-9 w-full max-w-xl rounded-full bg-white/10" />
        <div className="h-5 w-full max-w-2xl rounded-full bg-white/10" />
      </div>
      <TableSkeleton />
      <TableSkeleton />
    </div>
  );
}
