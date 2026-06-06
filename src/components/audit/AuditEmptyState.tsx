import { ShieldAlert } from "lucide-react";

export function AuditEmptyState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-6 py-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-200">
        <ShieldAlert className="size-6" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-slate-50">No audit logs found</h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">
        Sensitive activity will appear here after uploads, result edits, publishing actions, and school record changes are recorded.
      </p>
    </div>
  );
}
