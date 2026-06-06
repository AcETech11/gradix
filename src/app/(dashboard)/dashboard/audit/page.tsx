import { ShieldAlert } from "lucide-react";

import { getAuditLogsAction } from "@/actions/audit/get-audit-logs-action";
import { getFlaggedEditsAction } from "@/actions/audit/get-flagged-edits-action";
import { AuditExportButton } from "@/components/audit/AuditExportButton";
import { AuditFilters } from "@/components/audit/AuditFilters";
import { AuditLogTable } from "@/components/audit/AuditLogTable";
import { FlaggedEditsPanel } from "@/components/audit/FlaggedEditsPanel";
import { DataTableShell } from "@/components/dashboard/data-table-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { auditFilterSchema, type AuditFilters as AuditFilterValues } from "@/lib/audit/audit-types";

type AuditPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function resolveFilters(searchParams?: Promise<Record<string, string | string[] | undefined>>): Promise<AuditFilterValues> {
  const params = searchParams ? await searchParams : {};

  return auditFilterSchema.parse({
    action: firstParam(params.action),
    role: firstParam(params.role),
    entity: firstParam(params.entity),
    user: firstParam(params.user),
    from: firstParam(params.from),
    to: firstParam(params.to),
    search: firstParam(params.search),
  });
}

function UnauthorizedAuditState() {
  return (
    <div className="rounded-2xl border border-red-400/20 bg-red-500/[0.06] p-8 text-center shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)]">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-red-400/25 bg-red-500/10 text-red-200">
        <ShieldAlert className="size-6" aria-hidden="true" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold text-slate-50">Audit logs are restricted</h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-300">
        Only admins and headmasters can view school audit activity. This page contains sensitive accountability records.
      </p>
    </div>
  );
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const profile = await getCurrentUserProfile();

  if (!profile || (profile.role !== "admin" && profile.role !== "headmaster")) {
    return <UnauthorizedAuditState />;
  }

  const filters = await resolveFilters(searchParams);
  const [logs, filterOptionsLogs, flaggedEdits] = await Promise.all([getAuditLogsAction(filters), getAuditLogsAction({}), getFlaggedEditsAction()]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Audit"
        title="School activity audit trail"
        description="Review sensitive Gradix actions across uploads, score edits, result publishing, student records, and school workspace changes."
        actions={<AuditExportButton />}
      />

      <FlaggedEditsPanel edits={flaggedEdits} />

      <DataTableShell
        title="Audit logs"
        description="Every entry is scoped to this school workspace. Teachers cannot access this page or export these records."
        filters={<AuditFilters logs={filterOptionsLogs} />}
      >
        <AuditLogTable logs={logs} />
      </DataTableShell>
    </div>
  );
}
