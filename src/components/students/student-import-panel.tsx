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
  existingAdmissionNumbers: string[];
  canManage: boolean;
};

type ParsedImportState = {
  rows: StudentImportRow[];
  previewRows: StudentImportPreviewRow[];
  fileName: string;
};

type ImportGender = "" | "male" | "female" | "other";

function normalizeHeader(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
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
    admissionNumber: pickCell(row, ["admissionnumber", "admissionno", "admission"]),
    gender: pickCell(row, ["gender"]).toLowerCase() as StudentImportRow["gender"],
    dateOfBirth: pickCell(row, ["dateofbirth", "dob", "birthdate"]),
    className: pickCell(row, ["class"]),
    parentName: pickCell(row, ["parentguardianname", "parentname", "guardianname", "parent"]),
    parentPhone: pickCell(row, ["parentphone", "guardianphone", "phone"]),
    parentEmail: pickCell(row, ["parentemail", "guardianemail", "email"]),
    address: pickCell(row, ["address", "homeaddress"]),
  }));
}

function normalizeGender(value: StudentImportRow["gender"]): ImportGender {
  return value === "male" || value === "female" || value === "other" ? value : "";
}

function downloadStudentTemplate() {
  const rows = [
    {
      "Student Name": "Chidiadi Ugochukwu",
      "Admission Number": "ADM001",
      Class: "JSS 1A",
      Gender: "male",
      "Date of Birth": "2012-09-14",
      "Parent/Guardian Name": "Mrs Ugochukwu",
      "Parent Phone": "+2348000000000",
      "Parent Email": "parent@example.com",
      Address: "12 School Road",
    },
  ];
  const instructions = [
    ["Do not remove or rename column headers."],
    ["Student Name, Admission Number, and Class are required."],
    ["Class must already exist in Gradix or match an existing class name."],
    ["Student Code will be generated automatically."],
    ["Admission Number should be unique within the school."],
    ["Save and upload the completed file as .xlsx."],
  ];
  const workbook = XLSX.utils.book_new();
  const studentsSheet = XLSX.utils.json_to_sheet(rows, {
    header: ["Student Name", "Admission Number", "Class", "Gender", "Date of Birth", "Parent/Guardian Name", "Parent Phone", "Parent Email", "Address"],
  });
  const instructionsSheet = XLSX.utils.aoa_to_sheet([["Student Import Instructions"], [], ...instructions]);
  studentsSheet["!cols"] = [{ wch: 26 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 24 }, { wch: 18 }, { wch: 24 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(workbook, studentsSheet, "Students");
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");
  XLSX.writeFile(workbook, "gradix-student-import-template.xlsx");
}

export function StudentImportPanel({ classes, existingAdmissionNumbers, canManage }: StudentImportPanelProps) {
  const [open, setOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedImportState | null>(null);
  const { result, setResult, isPending, startTransition } = useAuthResult<{ imported: number; skipped: number; redirectTo: string }>();

  const classMap = useMemo(
    () => new Map(classes.map((classOption) => [classOption.name.trim().toLowerCase(), classOption.id])),
    [classes],
  );

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

    const seenAdmissions = new Set<string>();
    const existingAdmissions = new Set(existingAdmissionNumbers.map((value) => value.trim().toLowerCase()));

    const previewRows: StudentImportPreviewRow[] = normalizedRows.map((row, index) => {
      const issues: string[] = [];
      const schemaResult = studentImportRowSchema.safeParse(row);
      const classId = classMap.get(row.className.trim().toLowerCase()) ?? null;

      if (!schemaResult.success) {
        schemaResult.error.issues.forEach((issue) => {
          issues.push(issue.message);
        });
      }

      if (!classId) {
        issues.push(`Row ${index + 1}: class "${row.className}" does not exist.`);
      }

      const admissionKey = row.admissionNumber.trim().toLowerCase();
      if (existingAdmissions.has(admissionKey) || seenAdmissions.has(admissionKey)) {
        issues.push(`Row ${index + 1}: duplicate admission number "${row.admissionNumber}".`);
      }
      seenAdmissions.add(admissionKey);

      return {
        ...row,
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
      return {
        total: 0,
        valid: 0,
        invalid: 0,
        duplicates: 0,
        ready: 0,
      };
    }

    const duplicates = parsed.previewRows.filter((row) => row.issues.some((issue) => issue.toLowerCase().includes("duplicate"))).length;
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

    const validRows = parsed.previewRows.filter((row) => row.issues.length === 0).map((row) => ({
      studentName: row.studentName,
      admissionNumber: row.admissionNumber,
      gender: normalizeGender(row.gender),
      dateOfBirth: row.dateOfBirth ?? "",
      className: row.className,
      parentName: row.parentName ?? "",
      parentPhone: row.parentPhone ?? "",
      parentEmail: row.parentEmail ?? "",
      address: row.address ?? "",
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
        <Button className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" type="button" variant="outline" onClick={downloadStudentTemplate}>
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
                  <p className="text-xs text-slate-400">Preview your .xlsx file before importing rows into the school registry.</p>
                </div>
                <Button aria-label="Close import panel" size="icon" type="button" variant="ghost" onClick={() => setOpen(false)}>
                  <X className="size-5" />
                </Button>
              </div>

              <div className="grid gap-5 p-5 xl:grid-cols-[0.85fr_1.15fr]">
                <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <input
                    accept=".xlsx"
                    className="hidden"
                    id="student-import-file"
                    onChange={onPickFile}
                    type="file"
                  />
                  <div className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-50">Spreadsheet upload</h2>
                    <p className="text-sm text-slate-400">
                      Expected columns: Student Name, Admission Number, Class, Gender, Date of Birth, Parent/Guardian Name, Parent Phone, Parent Email, Address.
                    </p>
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
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-50">{summary.total}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Valid</p>
                      <p className="mt-2 text-2xl font-semibold text-emerald-300">{summary.valid}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Invalid</p>
                      <p className="mt-2 text-2xl font-semibold text-orange-200">{summary.invalid}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Duplicates</p>
                      <p className="mt-2 text-2xl font-semibold text-red-200">{summary.duplicates}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Ready</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-50">{summary.ready}</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-slate-50">Preview</h2>
                      <p className="text-sm text-slate-400">Review any issues before importing.</p>
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
                            <th className="px-4 py-3">Admission</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Class</th>
                            <th className="px-4 py-3">Issues</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {parsed.previewRows.map((row) => (
                            <tr className="align-top" key={`${row.rowNumber}-${row.admissionNumber}`}>
                              <td className="px-4 py-3 text-slate-400">{row.rowNumber}</td>
                              <td className="px-4 py-3 text-slate-100">{row.admissionNumber}</td>
                              <td className="px-4 py-3 text-slate-100">
                                {row.studentName}
                              </td>
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
                      <div className="flex min-h-64 items-center justify-center text-sm text-slate-400">
                        Select an `.xlsx` file to preview the rows.
                      </div>
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
