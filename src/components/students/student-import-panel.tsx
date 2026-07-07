"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Download, FileSpreadsheet, Import, X } from "lucide-react";
import * as XLSX from "xlsx";

import { importStudentsAction } from "@/actions/students";
import { AuthSpinner } from "@/components/auth/auth-loading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { studentImportRowSchema } from "@/lib/students/schema";
import type { StudentImportPreviewRow, StudentImportRow } from "@/types/students";
import { useAuthResult } from "@/hooks/use-auth-result";

type ClassOption = {
  id: string;
  name: string;
  level: string;
  arm: string | null;
};

type StudentImportPanelProps = {
  classes: ClassOption[];
  existingStudentKeys: string[];
  canManage: boolean;
};

type ParsedImportState = {
  rows: StudentImportRow[];
  previewRows: StudentImportPreviewRow[];
  fileName: string;
};

function normalizeHeader(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function pickCell(row: Record<string, unknown>, keyNames: string[]) {
  const entries = Object.entries(row);

  for (const [key, value] of entries) {
    if (keyNames.includes(normalizeHeader(key))) {
      return typeof value === "string" ? value.trim() : String(value ?? "").trim();
    }
  }

  return "";
}

function parseRows(sheetRows: Record<string, unknown>[]): StudentImportRow[] {
  return sheetRows.map((row) => ({
    studentName: pickCell(row, ["studentname", "name"]),
    className: pickCell(row, ["class", "classname"]),
  }));
}

function downloadStudentTemplate(classes: ClassOption[]) {
  const workbook = XLSX.utils.book_new();
  const studentsSheet = XLSX.utils.aoa_to_sheet([["Student Name", "Class"]]);
  studentsSheet["!cols"] = [{ wch: 32 }, { wch: 22 }];

  if (classes.length > 0) {
    const lastRow = 200;
    studentsSheet["!dataValidation"] = [
      {
        sqref: `B2:B${lastRow}`,
        type: "list",
        allowBlank: false,
        formula1: `"${classes.map((classOption) => classOption.name).join(",")}"`,
      },
    ];
  }

  const instructionsSheet = XLSX.utils.aoa_to_sheet([
    ["Student Import Instructions"],
    ["Only Student Name and Class are required."],
    ["Gradix generates permanent student/result codes automatically."],
    ["No personal or parent data is needed."],
    ["Class must match an existing class in your school."],
    ["Do not rename the Student Name or Class headers."],
  ]);
  const classesSheet = XLSX.utils.aoa_to_sheet([["Available Classes"], ...classes.map((classOption) => [classOption.name])]);

  instructionsSheet["!cols"] = [{ wch: 72 }];
  classesSheet["!cols"] = [{ wch: 28 }];

  XLSX.utils.book_append_sheet(workbook, studentsSheet, "Students");
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");
  XLSX.utils.book_append_sheet(workbook, classesSheet, "Classes");
  XLSX.writeFile(workbook, "gradix-student-import-template.xlsx");
}

export function StudentImportPanel({ classes, existingStudentKeys, canManage }: StudentImportPanelProps) {
  const [open, setOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedImportState | null>(null);
  const { result, setResult, isPending, startTransition } = useAuthResult<{ imported: number; skipped: number; redirectTo: string }>();

  const classMap = useMemo(() => new Map(classes.map((classOption) => [classOption.name.trim().toLowerCase(), classOption.id])), [classes]);
  const existingKeys = useMemo(() => new Set(existingStudentKeys), [existingStudentKeys]);

  async function handleFileSelected(file: File) {
    setFileError(null);
    setResult(null);

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setFileError("Upload a .xlsx spreadsheet.");
      return;
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const sheetRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const normalizedRows = parseRows(sheetRows);
    const seenKeys = new Set<string>();

    const previewRows: StudentImportPreviewRow[] = normalizedRows.map((row, index) => {
      const issues: string[] = [];
      const cleanedName = row.studentName.trim().replace(/\s+/g, " ");
      const cleanedClass = row.className.trim();
      const schemaResult = studentImportRowSchema.safeParse({ studentName: cleanedName, className: cleanedClass });
      const classId = classMap.get(cleanedClass.toLowerCase()) ?? null;

      if (!schemaResult.success) {
        schemaResult.error.issues.forEach((issue) => {
          issues.push(`Row ${index + 1}: ${issue.message}`);
        });
      }

      if (!classId) {
        issues.push(`Row ${index + 1}: class "${cleanedClass || "blank"}" does not exist.`);
      }

      const duplicateKey = `${normalizeName(cleanedName)}:${classId ?? cleanedClass.toLowerCase()}`;
      if (classId && existingKeys.has(duplicateKey)) {
        issues.push(`Row ${index + 1}: "${cleanedName}" already exists in ${cleanedClass}.`);
      }

      if (seenKeys.has(duplicateKey)) {
        issues.push(`Row ${index + 1}: duplicate student name and class in this file.`);
      }
      seenKeys.add(duplicateKey);

      return {
        studentName: cleanedName,
        className: cleanedClass,
        classId,
        rowNumber: index + 1,
        issues,
      };
    });

    setParsed({
      rows: normalizedRows,
      previewRows,
      fileName: file.name,
    });
  }

  function onPickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    void handleFileSelected(file).catch((error) => {
      setFileError(error instanceof Error ? error.message : "Unable to parse the spreadsheet.");
    });
  }

  const summary = useMemo(() => {
    if (!parsed) {
      return { total: 0, valid: 0, invalid: 0, duplicates: 0, ready: 0 };
    }

    const duplicates = parsed.previewRows.filter((row) => row.issues.some((issue) => issue.toLowerCase().includes("duplicate") || issue.toLowerCase().includes("already exists"))).length;
    const invalid = parsed.previewRows.filter((row) => row.issues.length > 0).length;

    return {
      total: parsed.previewRows.length,
      valid: parsed.previewRows.length - invalid,
      invalid,
      duplicates,
      ready: parsed.previewRows.filter((row) => row.issues.length === 0).length,
    };
  }, [parsed]);

  function clearImport() {
    setParsed(null);
    setFileError(null);
    setResult(null);
  }

  function openFilePicker() {
    document.getElementById("student-import-file")?.click();
  }

  function importRows() {
    if (!parsed) {
      return;
    }

    const validRows = parsed.previewRows
      .filter((row) => row.issues.length === 0)
      .map((row) => ({
        studentName: row.studentName,
        className: row.className,
      }));

    setResult(null);
    startTransition(async () => {
      const response = await importStudentsAction(validRows);
      setResult(response);

      if (response.ok && response.data?.redirectTo) {
        window.location.href = response.data.redirectTo;
      }
    });
  }

  if (!canManage) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" type="button" variant="outline" onClick={() => downloadStudentTemplate(classes)}>
          <Download className="size-4" />
          Download Student Template
        </Button>
        <Button className="bg-orange-500 text-slate-950 hover:bg-orange-400" type="button" onClick={() => setOpen(true)}>
          <Import className="size-4" />
          Import Students
        </Button>
      </div>

      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:items-center sm:p-6">
            <button aria-label="Close import panel" className="absolute inset-0" onClick={() => setOpen(false)} type="button" />
            <motion.section
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 max-h-[90dvh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#08111f] text-slate-100 shadow-2xl"
              exit={{ opacity: 0, y: 20 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-50">Bulk Import Students</p>
                  <p className="text-xs text-slate-400">Upload an .xlsx file with Student Name and Class only.</p>
                </div>
                <Button aria-label="Close import panel" size="icon" type="button" variant="ghost" onClick={() => setOpen(false)}>
                  <X className="size-5" />
                </Button>
              </div>

              <div className="grid gap-5 p-5 xl:grid-cols-[0.85fr_1.15fr]">
                <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <input accept=".xlsx" className="hidden" id="student-import-file" onChange={onPickFile} type="file" />
                  <div className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-50">Spreadsheet upload</h2>
                    <p className="text-sm text-slate-400">Expected columns: Student Name, Class. Gradix generates student/result codes automatically.</p>
                  </div>

                  <div
                    className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-4 text-center"
                    onClick={openFilePicker}
                    role="presentation"
                  >
                    <FileSpreadsheet className="size-10 text-orange-300" />
                    <p className="mt-3 text-sm font-medium text-slate-50">{parsed ? parsed.fileName : "Choose an .xlsx file"}</p>
                    <p className="mt-1 text-xs text-slate-400">Click or tap to browse the spreadsheet.</p>
                  </div>

                  {fileError ? <p className="text-sm text-red-300">{fileError}</p> : null}
                  {result?.message ? (
                    <div
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-sm",
                        result.ok ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" : "border-red-400/20 bg-red-500/10 text-red-200",
                      )}
                    >
                      {result.message}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 xl:grid-cols-2">
                    {[
                      ["Total", summary.total, "text-slate-50"],
                      ["Valid", summary.valid, "text-emerald-300"],
                      ["Invalid", summary.invalid, "text-orange-200"],
                      ["Duplicates", summary.duplicates, "text-red-200"],
                      ["Ready", summary.ready, "text-slate-50"],
                    ].map(([label, value, color]) => (
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3" key={label}>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
                        <p className={`mt-2 text-2xl font-semibold ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-slate-50">Preview</h2>
                      <p className="text-sm text-slate-400">Review row-level issues before importing.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" type="button" variant="outline" onClick={clearImport}>
                        Reset
                      </Button>
                      <Button className="bg-orange-500 text-slate-950 hover:bg-orange-400" disabled={isPending || !parsed || summary.ready === 0} type="button" onClick={importRows}>
                        {isPending ? <AuthSpinner label="Importing" /> : "Import now"}
                      </Button>
                    </div>
                  </div>

                  <div className="max-h-[54dvh] overflow-auto rounded-2xl border border-white/10">
                    {parsed ? (
                      <table className="min-w-full divide-y divide-white/10 text-sm">
                        <thead className="sticky top-0 bg-[#0a1526] text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          <tr>
                            <th className="px-4 py-3">Row</th>
                            <th className="px-4 py-3">Student Name</th>
                            <th className="px-4 py-3">Class</th>
                            <th className="px-4 py-3">Issues</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {parsed.previewRows.map((row) => (
                            <tr className="align-top" key={`${row.rowNumber}-${row.studentName}-${row.className}`}>
                              <td className="px-4 py-3 text-slate-400">{row.rowNumber}</td>
                              <td className="px-4 py-3 text-slate-100">{row.studentName}</td>
                              <td className="px-4 py-3 text-slate-100">{row.className}</td>
                              <td className="px-4 py-3">
                                {row.issues.length ? (
                                  <ul className="space-y-1 text-xs text-red-200">
                                    {row.issues.map((issue) => (
                                      <li key={issue}>{issue}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                                    Ready
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex min-h-64 items-center justify-center text-sm text-slate-400">Select an .xlsx file to preview the rows.</div>
                    )}
                  </div>
                </section>
              </div>
            </motion.section>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
