"use server";

import * as XLSX from "xlsx";

import { getParentAccessRecordsAction } from "@/actions/parent-access/get-parent-access-records-action";
import { formatRemaining, formatTerm, formatViews } from "@/lib/parent-access/parent-access-formatters";
import type { ParentAccessExportResult } from "@/lib/parent-access/parent-access-types";

function statusLabel(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function exportParentAccessAction(input?: unknown): Promise<ParentAccessExportResult> {
  try {
    const data = await getParentAccessRecordsAction(input);
    const rows = data.records.map((record) => ({
      "Student Name": record.studentName,
      "Student Code": record.studentCode,
      Class: record.className,
      Term: formatTerm(record.term),
      "Academic Year": record.academicYear,
      "Views Used": formatViews(record.viewsUsed, record.maxViews),
      "Views Remaining": formatRemaining(record.viewsUsed, record.maxViews),
      "Last Checked": record.lastCheckedAt ? new Date(record.lastCheckedAt).toLocaleString() : "Never",
      Status: statusLabel(record.status),
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(
      rows.length
        ? rows
        : [
            {
              "Student Name": "",
              "Student Code": "",
              Class: "",
              Term: "",
              "Academic Year": "",
              "Views Used": "",
              "Views Remaining": "",
              "Last Checked": "",
              Status: "",
            },
          ],
    );

    worksheet["!cols"] = [
      { wch: 28 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 16 },
      { wch: 18 },
      { wch: 20 },
      { wch: 24 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Parent Access");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;

    return {
      ok: true,
      fileName: `gradix-parent-access-${new Date().toISOString().slice(0, 10)}.xlsx`,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      base64: buffer.toString("base64"),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Parent access export could not be generated.",
    };
  }
}
