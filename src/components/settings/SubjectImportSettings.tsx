"use client";

import { useMemo, useState, useTransition, type ChangeEvent } from "react";
import { BookOpen, Download, Import } from "lucide-react";
import * as XLSX from "xlsx";

import { importSubjectsAction } from "@/actions/subjects/import-subjects-action";
import { Button } from "@/components/ui/button";
import { subjectImportRowSchema } from "@/lib/subjects/schema";
import type { SchoolClassAssignment } from "@/lib/settings/settings-types";
import type { SubjectImportPreviewRow, SubjectImportRow } from "@/types/subjects";

type SubjectImportSettingsProps = {
  classes: SchoolClassAssignment[];
  canManage: boolean;
};

function normalizeHeader(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function pickCell(row: Record<string, unknown>, keyNames: string[]) {
  for (const [key, value] of Object.entries(row)) {
    if (keyNames.includes(normalizeHeader(key))) {
      return typeof value === "string" ? value.trim() : String(value ?? "").trim();
    }
  }

  return "";
}

function parseRows(sheetRows: Record<string, unknown>[]): SubjectImportRow[] {
  return sheetRows.map((row) => ({
    subjectName: pickCell(row, ["subjectname", "subject"]),
    subjectCode: pickCell(row, ["subjectcode", "code"]),
    className: pickCell(row, ["class", "classname"]),
    category: pickCell(row, ["category"]),
    isCompulsory: pickCell(row, ["iscompulsory", "compulsory"]).toLowerCase() as SubjectImportRow["isCompulsory"],
  }));
}

function downloadSubjectTemplate() {
  const workbook = XLSX.utils.book_new();
  const subjectsSheet = XLSX.utils.json_to_sheet(
    [
      { "Subject Name": "Mathematics", "Subject Code": "MATH", Class: "JSS 1A", Category: "Core", "Is Compulsory": "Yes" },
      { "Subject Name": "English Language", "Subject Code": "ENG", Class: "JSS 1A", Category: "Core", "Is Compulsory": "Yes" },
      { "Subject Name": "Basic Science", "Subject Code": "BSC", Class: "JSS 1A", Category: "Science", "Is Compulsory": "Yes" },
    ],
    { header: ["Subject Name", "Subject Code", "Class", "Category", "Is Compulsory"] },
  );
  const instructionsSheet = XLSX.utils.aoa_to_sheet([
    ["Subject Import Instructions"],
    [],
    ["Do not remove or rename column headers."],
    ["Subject Name, Subject Code, and Class are required."],
    ["Class must already exist in Gradix."],
    ["Subject Code should be unique per school."],
    ["Is Compulsory should be Yes or No."],
  ]);
  subjectsSheet["!cols"] = [{ wch: 26 }, { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(workbook, subjectsSheet, "Subjects");
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");
  XLSX.writeFile(workbook, "gradix-subject-import-template.xlsx");
}

export function SubjectImportSettings({ classes, canManage }: SubjectImportSettingsProps) {
  const [rows, setRows] = useState<SubjectImportPreviewRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const classMap = useMemo(() => new Map(classes.map((row) => [row.name.trim().toLowerCase(), row.id])), [classes]);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setMessage("");

    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setMessage("Upload a .xlsx spreadsheet.");
      return;
    }

    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const normalizedRows = parseRows(XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" }));
    const seenPairs = new Set<string>();
    const previewRows = normalizedRows.map((row, index) => {
      const issues: string[] = [];
      const parsed = subjectImportRowSchema.safeParse(row);
      const classId = classMap.get(row.className.trim().toLowerCase()) ?? null;
      const pairKey = `${row.subjectCode.trim().toLowerCase()}:${row.className.trim().toLowerCase()}`;

      if (!parsed.success) {
        parsed.error.issues.forEach((issue) => issues.push(issue.message));
      }

      if (!classId) {
        issues.push(`Row ${index + 1}: class "${row.className}" does not exist.`);
      }

      if (row.isCompulsory && row.isCompulsory !== "yes" && row.isCompulsory !== "no") {
        issues.push(`Row ${index + 1}: Is Compulsory must be Yes or No.`);
      }

      if (seenPairs.has(pairKey)) {
        issues.push(`Row ${index + 1}: duplicate subject/class combination.`);
      }
      seenPairs.add(pairKey);

      return { ...row, rowNumber: index + 1, classId, issues };
    });

    setRows(previewRows);
    setFileName(file.name);
  }

  function importRows() {
    const validRows = rows.filter((row) => row.issues.length === 0).map((row) => ({
      subjectName: row.subjectName,
      subjectCode: row.subjectCode,
      className: row.className,
      category: row.category ?? "",
      isCompulsory: row.isCompulsory ?? "",
    }));

    startTransition(async () => {
      const result = await importSubjectsAction(validRows);
      setMessage(result.message);
      if (result.ok) {
        setRows([]);
        setFileName("");
      }
    });
  }

  const validCount = rows.filter((row) => row.issues.length === 0).length;
  const invalidCount = rows.length - validCount;

  return (
    <section className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/75 p-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-50">Subjects & Class Setup</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">Download a subject template, preview rows, and import class-subject assignments safely.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" type="button" variant="outline" onClick={downloadSubjectTemplate}>
          <Download className="size-4" />
          Download Subject Template
        </Button>
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-orange-400">
          <Import className="size-4" />
          Import Subjects
          <input accept=".xlsx" className="hidden" type="file" onChange={handleFile} disabled={!canManage || isPending} />
        </label>
      </div>
      {!canManage ? <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">Only admins and headmasters can import subjects.</p> : null}
      {message ? <p className={message.includes("success") ? "text-sm text-emerald-300" : "text-sm text-red-300"}>{message}</p> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Rows" value={rows.length} />
        <Metric label="Valid" value={validCount} tone="success" />
        <Metric label="Invalid" value={invalidCount} tone="warning" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="flex items-center justify-between gap-3 bg-slate-950/70 px-4 py-3">
          <p className="text-sm font-semibold text-slate-100">{fileName || "No subject file selected"}</p>
          <Button className="bg-orange-500 text-slate-950 hover:bg-orange-400" disabled={!canManage || isPending || validCount === 0} type="button" onClick={importRows}>
            {isPending ? "Importing..." : "Confirm import"}
          </Button>
        </div>
        {rows.length ? (
          <div className="max-h-96 overflow-auto">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="sticky top-0 bg-[#0a1526] text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Row</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {rows.map((row) => (
                  <tr key={`${row.rowNumber}-${row.subjectCode}-${row.className}`}>
                    <td className="px-4 py-3 text-slate-400">{row.rowNumber}</td>
                    <td className="px-4 py-3 text-slate-100">{row.subjectName}</td>
                    <td className="px-4 py-3 text-slate-100">{row.subjectCode}</td>
                    <td className="px-4 py-3 text-slate-100">{row.className}</td>
                    <td className="px-4 py-3">
                      {row.issues.length ? <span className="text-xs text-red-200">{row.issues.join(" ")}</span> : <span className="text-xs font-semibold text-emerald-300">Ready</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
            <BookOpen className="size-10 text-orange-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-50">No subjects added yet.</h3>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">Add subjects manually during onboarding or upload a subject template for each class.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: "success" | "warning" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={tone === "success" ? "mt-2 text-2xl font-semibold text-emerald-300" : tone === "warning" ? "mt-2 text-2xl font-semibold text-orange-200" : "mt-2 text-2xl font-semibold text-slate-50"}>{value}</p>
    </div>
  );
}
