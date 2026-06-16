import * as XLSX from "xlsx";

import type { ParsedResultTemplate, ParsedSubjectColumns, ParsedTemplateRow } from "@/lib/uploads/upload-types";

const REQUIRED_IDENTITY_HEADERS = ["Student Code", "Student Name", "Admission Number", "Class"] as const;
const CLASS_TEACHER_COMMENT_HEADER = "Class Teacher Comment";

function normalizeHeader(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeSubjectName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function parseSubjectHeader(header: string) {
  const trimmed = header.trim();
  const match = trimmed.match(/^(.+?)\s+(CA \(0-40\)|Exam \(0-60\)|Remark)$/i);

  if (!match) {
    return null;
  }

  const [, subjectName, kind] = match;

  return {
    subjectName: subjectName.trim(),
    kind: kind.toLowerCase().startsWith("ca") ? "ca" : kind.toLowerCase().startsWith("exam") ? "exam" : "remark",
  } as const;
}

function findHeaderRow(rows: unknown[][]) {
  return rows.findIndex((row) => {
    const normalized = row.map(normalizeHeader);

    return REQUIRED_IDENTITY_HEADERS.every((header) => normalized.includes(header));
  });
}

function cellValueToText(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

export function parseResultTemplate(base64: string): ParsedResultTemplate {
  const workbook = XLSX.read(base64, { type: "base64" });
  const worksheet = workbook.Sheets["Results Template"] ?? workbook.Sheets[workbook.SheetNames[0]];

  if (!worksheet) {
    throw new Error("The workbook is empty. Upload a completed Gradix result template.");
  }

  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });
  const headerRowIndex = findHeaderRow(rawRows);

  if (headerRowIndex === -1) {
    return {
      headers: [],
      rows: [],
      subjectColumns: [],
      unknownSubjectColumns: [],
      missingIdentityHeaders: [...REQUIRED_IDENTITY_HEADERS],
    };
  }

  const headers = rawRows[headerRowIndex].map(normalizeHeader);
  const missingIdentityHeaders = REQUIRED_IDENTITY_HEADERS.filter((header) => !headers.includes(header));
  const headerIndexes = new Map(headers.map((header, index) => [header, index]));
  const subjectColumnsByName = new Map<string, ParsedSubjectColumns>();
  const unknownSubjectColumns: string[] = [];

  headers.slice(4).forEach((header) => {
    if (!header) {
      return;
    }

    if (header === CLASS_TEACHER_COMMENT_HEADER) {
      return;
    }

    const parsed = parseSubjectHeader(header);

    if (!parsed) {
      unknownSubjectColumns.push(header);
      return;
    }

    const key = normalizeSubjectName(parsed.subjectName);
    const existing = subjectColumnsByName.get(key) ?? { subjectName: parsed.subjectName };

    if (parsed.kind === "ca") {
      existing.caHeader = header;
    } else if (parsed.kind === "exam") {
      existing.examHeader = header;
    } else {
      existing.remarkHeader = header;
    }

    subjectColumnsByName.set(key, existing);
  });

  const rows: ParsedTemplateRow[] = rawRows
    .slice(headerRowIndex + 1)
    .map((rawRow, index) => {
      const values = Object.fromEntries(headers.map((header, headerIndex) => [header, rawRow[headerIndex] as string | number | null]));

      return {
        rowNumber: headerRowIndex + index + 2,
        studentCode: cellValueToText(rawRow[headerIndexes.get("Student Code") ?? -1]),
        studentName: cellValueToText(rawRow[headerIndexes.get("Student Name") ?? -1]),
        admissionNumber: cellValueToText(rawRow[headerIndexes.get("Admission Number") ?? -1]),
        className: cellValueToText(rawRow[headerIndexes.get("Class") ?? -1]),
        classTeacherComment: cellValueToText(rawRow[headerIndexes.get(CLASS_TEACHER_COMMENT_HEADER) ?? -1]),
        values,
      };
    })
    .filter((row) => row.studentCode || row.studentName || row.admissionNumber);

  return {
    headers,
    rows,
    subjectColumns: Array.from(subjectColumnsByName.values()),
    unknownSubjectColumns,
    missingIdentityHeaders,
  };
}

export function normalizeTemplateSubjectName(value: string) {
  return normalizeSubjectName(value);
}
