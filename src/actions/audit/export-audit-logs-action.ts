"use server";

import * as XLSX from "xlsx";

import { getAuditLogsAction } from "@/actions/audit/get-audit-logs-action";
import { formatAuditDetailLines, formatAuditEntity } from "@/lib/audit/format-audit-details";
import type { AuditExportResult } from "@/lib/audit/audit-types";

export async function exportAuditLogsAction(input?: unknown): Promise<AuditExportResult> {
  try {
    const logs = await getAuditLogsAction(input);
    const rows = logs.map((log) => ({
      Date: new Date(log.createdAt).toLocaleString(),
      User: log.actor.name,
      Role: log.actorRole ?? "system",
      Action: log.action,
      Entity: formatAuditEntity(log.entity),
      "Record ID": log.recordId ?? "",
      Details: formatAuditDetailLines(log.action, log.entity, log.details).join("\n"),
      "IP Address": log.ipAddress ?? "",
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Date: "", User: "", Role: "", Action: "", Entity: "", "Record ID": "", Details: "", "IP Address": "" }]);

    worksheet["!cols"] = [
      { wch: 22 },
      { wch: 24 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 38 },
      { wch: 56 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;

    return {
      ok: true,
      fileName: `gradix-audit-logs-${new Date().toISOString().slice(0, 10)}.xlsx`,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      base64: buffer.toString("base64"),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Audit logs could not be exported.",
    };
  }
}
