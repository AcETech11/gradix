import { formatAuditDetailLines } from "@/lib/audit/format-audit-details";
import type { AuditLogItem } from "@/lib/audit/audit-types";

export function AuditDetailsDrawer({ log }: { log: AuditLogItem }) {
  const lines = formatAuditDetailLines(log.action, log.entity, log.details);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Record ID</span>
          <p className="mt-1 break-all text-slate-100">{log.recordId ?? "Not recorded"}</p>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">IP Address</span>
          <p className="mt-1 text-slate-100">{log.ipAddress ?? "Not available"}</p>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">User Agent</span>
          <p className="mt-1 line-clamp-2 text-slate-100">{log.userAgent ?? "Not available"}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="text-sm font-semibold text-slate-50">Event details</h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
          {lines.map((line) => (
            <li className="break-words" key={line}>
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
