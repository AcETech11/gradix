"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";

import { exportAuditLogsAction } from "@/actions/audit/export-audit-logs-action";
import { Button } from "@/components/ui/button";
import type { AuditFilters } from "@/lib/audit/audit-types";

function downloadBase64File(fileName: string, mimeType: string, base64: string) {
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function AuditExportButton() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);

    const filters: AuditFilters = {
      action: searchParams.get("action") ?? "",
      role: searchParams.get("role") ?? "",
      entity: searchParams.get("entity") ?? "",
      user: searchParams.get("user") ?? "",
      from: searchParams.get("from") ?? "",
      to: searchParams.get("to") ?? "",
      search: searchParams.get("search") ?? "",
    };
    const result = await exportAuditLogsAction(filters);

    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    downloadBase64File(result.fileName, result.mimeType, result.base64);
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <Button className="bg-orange-500 text-slate-950 hover:bg-orange-400" disabled={loading} type="button" onClick={handleExport}>
        <Download className="size-4" />
        {loading ? "Exporting..." : "Export logs"}
      </Button>
      {error ? <p className="max-w-xs text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
