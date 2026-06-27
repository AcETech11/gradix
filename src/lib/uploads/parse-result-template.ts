import * as XLSX from "xlsx";

import {
  AFFECTIVE_TRAITS,
  formatTraitHeader,
  PSYCHOMOTOR_TRAITS,
  type ClassTermReportDetails,
  type TraitRatingMap,
} from "@/lib/reports/primary-report";
import type { ParsedReportDetailsRow, ParsedResultTemplate, ParsedSubjectColumns, ParsedTemplateRow } from "@/lib/uploads/upload-types";

const REQUIRED_IDENTITY_HEADERS = ["Student Code", "Student Name", "Admission Number", "Class"] as const;
const CLASS_TEACHER_COMMENT_HEADER = "Class Teacher Comment";
const MERGED_TEMPLATE_SHEET_NAME = "Results & Report Details";
const LEGACY_TEMPLATE_SHEET_NAME = "Results Template";
const REPORT_DETAIL_HEADERS = new Set([
  CLASS_TEACHER_COMMENT_HEADER,
  "Attendance Present",
  "Attendance Absent",
  ...AFFECTIVE_TRAITS.map(formatTraitHeader),
  ...AFFECTIVE_TRAITS,
  ...PSYCHOMOTOR_TRAITS.map(formatTraitHeader),
  ...PSYCHOMOTOR_TRAITS,
]);

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

function numberFromCell(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : Number.NaN;

  const parsed = Number(String(value).trim());

  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function dateFromCell(value: unknown) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (!parsed) return null;

    return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }

  const text = String(value).trim();
  const timestamp = Date.parse(text);

  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString().slice(0, 10);
}

function parseReportDetailsSheet(workbook: XLSX.WorkBook) {
  const worksheet = workbook.Sheets["Report Details"];

  if (!worksheet) {
    return { rows: [] as ParsedReportDetailsRow[], errors: [] as string[], exists: false };
  }

  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, blankrows: false, defval: "" });
  const headerRowIndex = rawRows.findIndex((row) => {
    const normalized = row.map(normalizeHeader);

    return normalized.includes("Student Code") && normalized.includes("Student Name");
  });

  if (headerRowIndex === -1) {
    return { rows: [] as ParsedReportDetailsRow[], errors: ["Report Details is missing Student Code and Student Name headers."], exists: true };
  }

  const headers = rawRows[headerRowIndex].map(normalizeHeader);
  const headerIndexes = new Map(headers.map((header, index) => [header, index]));
  const get = (row: unknown[], header: string) => row[headerIndexes.get(header) ?? -1] as string | number | null;
  const getTrait = (row: unknown[], trait: string) =>
    row[(headerIndexes.get(formatTraitHeader(trait)) ?? headerIndexes.get(trait)) ?? -1] as string | number | null;

  const errors: string[] = [];
  const rows = rawRows
    .slice(headerRowIndex + 1)
    .map((rawRow, index) => {
      const affectiveDomain: TraitRatingMap = {};
      const psychomotorDomain: TraitRatingMap = {};
      const rowNumber = headerRowIndex + index + 2;
      const attendancePresent = numberFromCell(get(rawRow, "Attendance Present"));
      const attendanceAbsent = numberFromCell(get(rawRow, "Attendance Absent"));

      if (Number.isNaN(attendancePresent)) {
        errors.push(`Report Details row ${rowNumber}: Attendance Present must be a whole number greater than or equal to 0.`);
      }

      if (Number.isNaN(attendanceAbsent)) {
        errors.push(`Report Details row ${rowNumber}: Attendance Absent must be a whole number greater than or equal to 0.`);
      }

      AFFECTIVE_TRAITS.forEach((trait) => {
        const value = numberFromCell(getTrait(rawRow, trait));
        if (value !== null && (!Number.isInteger(value) || value < 1 || value > 5)) {
          errors.push(`Report Details row ${rowNumber}: ${trait} must be a whole number from 1 to 5.`);
        }
        if (value !== null && !Number.isNaN(value)) affectiveDomain[trait] = value;
      });
      PSYCHOMOTOR_TRAITS.forEach((trait) => {
        const value = numberFromCell(getTrait(rawRow, trait));
        if (value !== null && (!Number.isInteger(value) || value < 1 || value > 5)) {
          errors.push(`Report Details row ${rowNumber}: ${trait} must be a whole number from 1 to 5.`);
        }
        if (value !== null && !Number.isNaN(value)) psychomotorDomain[trait] = value;
      });

      return {
        rowNumber,
        studentCode: cellValueToText(get(rawRow, "Student Code")),
        studentName: cellValueToText(get(rawRow, "Student Name")),
        attendancePresent: Number.isNaN(attendancePresent) ? null : attendancePresent,
        attendanceAbsent: Number.isNaN(attendanceAbsent) ? null : attendanceAbsent,
        affectiveDomain,
        psychomotorDomain,
        classTeacherComment: cellValueToText(get(rawRow, CLASS_TEACHER_COMMENT_HEADER)),
        values: Object.fromEntries(headers.map((header, headerIndex) => [header, rawRow[headerIndex] as string | number | null])),
      } satisfies ParsedReportDetailsRow;
    })
    .filter((row) => row.studentCode || row.studentName);

  return { rows, errors, exists: true };
}

function parseMergedReportDetailsRows(rawRows: unknown[][], headerRowIndex: number, headers: string[]) {
  const hasMergedReportColumns = headers.some((header) => {
    if (header === CLASS_TEACHER_COMMENT_HEADER) {
      return false;
    }

    return REPORT_DETAIL_HEADERS.has(header);
  });

  if (!hasMergedReportColumns) {
    return { rows: [] as ParsedReportDetailsRow[], errors: [] as string[], exists: false };
  }

  const headerIndexes = new Map(headers.map((header, index) => [header, index]));
  const get = (row: unknown[], header: string) => row[headerIndexes.get(header) ?? -1] as string | number | null;
  const getTrait = (row: unknown[], trait: string) =>
    row[(headerIndexes.get(formatTraitHeader(trait)) ?? headerIndexes.get(trait)) ?? -1] as string | number | null;

  const errors: string[] = [];
  const rows = rawRows
    .slice(headerRowIndex + 1)
    .map((rawRow, index) => {
      const affectiveDomain: TraitRatingMap = {};
      const psychomotorDomain: TraitRatingMap = {};
      const rowNumber = headerRowIndex + index + 2;
      const attendancePresent = numberFromCell(get(rawRow, "Attendance Present"));
      const attendanceAbsent = numberFromCell(get(rawRow, "Attendance Absent"));

      if (Number.isNaN(attendancePresent)) {
        errors.push(`Results & Report Details row ${rowNumber}: Attendance Present must be a whole number greater than or equal to 0.`);
      }

      if (Number.isNaN(attendanceAbsent)) {
        errors.push(`Results & Report Details row ${rowNumber}: Attendance Absent must be a whole number greater than or equal to 0.`);
      }

      AFFECTIVE_TRAITS.forEach((trait) => {
        const value = numberFromCell(getTrait(rawRow, trait));
        if (value !== null && (!Number.isInteger(value) || value < 1 || value > 5)) {
          errors.push(`Results & Report Details row ${rowNumber}: ${trait} must be a whole number from 1 to 5.`);
        }
        if (value !== null && !Number.isNaN(value)) affectiveDomain[trait] = value;
      });
      PSYCHOMOTOR_TRAITS.forEach((trait) => {
        const value = numberFromCell(getTrait(rawRow, trait));
        if (value !== null && (!Number.isInteger(value) || value < 1 || value > 5)) {
          errors.push(`Results & Report Details row ${rowNumber}: ${trait} must be a whole number from 1 to 5.`);
        }
        if (value !== null && !Number.isNaN(value)) psychomotorDomain[trait] = value;
      });

      return {
        rowNumber,
        studentCode: cellValueToText(get(rawRow, "Student Code")),
        studentName: cellValueToText(get(rawRow, "Student Name")),
        attendancePresent: Number.isNaN(attendancePresent) ? null : attendancePresent,
        attendanceAbsent: Number.isNaN(attendanceAbsent) ? null : attendanceAbsent,
        affectiveDomain,
        psychomotorDomain,
        classTeacherComment: cellValueToText(get(rawRow, CLASS_TEACHER_COMMENT_HEADER)),
        values: Object.fromEntries(headers.map((header, headerIndex) => [header, rawRow[headerIndex] as string | number | null])),
      } satisfies ParsedReportDetailsRow;
    })
    .filter((row) => row.studentCode || row.studentName);

  return { rows, errors, exists: true };
}

function parseTermDetailsSheet(workbook: XLSX.WorkBook) {
  const worksheet = workbook.Sheets["Term Details"];

  if (!worksheet) {
    return { details: null as ClassTermReportDetails | null, errors: [] as string[], exists: false };
  }

  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, blankrows: false, defval: "" });
  const headerRowIndex = rawRows.findIndex((row) => row.map(normalizeHeader).includes("No. of Days School Opened"));

  if (headerRowIndex === -1 || !rawRows[headerRowIndex + 1]) {
    return { details: null, errors: ["Term Details is missing the required headers or detail row."], exists: true };
  }

  const headers = rawRows[headerRowIndex].map(normalizeHeader);
  const detailRow = rawRows[headerRowIndex + 1];
  const headerIndexes = new Map(headers.map((header, index) => [header, index]));
  const get = (header: string) => detailRow[headerIndexes.get(header) ?? -1] as string | number | null;
  const schoolOpenDays = numberFromCell(get("No. of Days School Opened"));
  const termEndsRaw = get("Term Ends");
  const nextTermBeginsRaw = get("Next Term Begins");
  const termEndsOn = dateFromCell(termEndsRaw);
  const nextTermBeginsOn = dateFromCell(nextTermBeginsRaw);
  const errors: string[] = [];

  if (Number.isNaN(schoolOpenDays) || (schoolOpenDays !== null && (!Number.isInteger(schoolOpenDays) || schoolOpenDays < 0))) {
    errors.push("Term Details: No. of Days School Opened must be a whole number greater than or equal to 0.");
  }

  if (cellValueToText(termEndsRaw) && !termEndsOn) {
    errors.push("Term Details: Term Ends must be a valid date.");
  }

  if (cellValueToText(nextTermBeginsRaw) && !nextTermBeginsOn) {
    errors.push("Term Details: Next Term Begins must be a valid date.");
  }

  return {
    details: {
      schoolOpenDays: Number.isNaN(schoolOpenDays) ? null : schoolOpenDays,
      termEndsOn,
      nextTermBeginsOn,
    },
    errors,
    exists: true,
  };
}

export function parseResultTemplate(base64: string): ParsedResultTemplate {
  const workbook = XLSX.read(base64, { type: "base64" });
  const worksheet = workbook.Sheets[MERGED_TEMPLATE_SHEET_NAME] ?? workbook.Sheets[LEGACY_TEMPLATE_SHEET_NAME] ?? workbook.Sheets[workbook.SheetNames[0]];

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
    const reportDetails = parseReportDetailsSheet(workbook);
    const termDetails = parseTermDetailsSheet(workbook);

    return {
      headers: [],
      rows: [],
      subjectColumns: [],
      unknownSubjectColumns: [],
      missingIdentityHeaders: [...REQUIRED_IDENTITY_HEADERS],
      reportDetailsRows: reportDetails.rows,
      hasReportDetailsSheet: reportDetails.exists,
      termDetails: termDetails.details,
      hasTermDetailsSheet: termDetails.exists,
      reportDetailErrors: reportDetails.errors,
      termDetailErrors: termDetails.errors,
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

    if (REPORT_DETAIL_HEADERS.has(header)) {
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

  const mergedReportDetails = parseMergedReportDetailsRows(rawRows, headerRowIndex, headers);
  const legacyReportDetails = parseReportDetailsSheet(workbook);
  const reportDetails = mergedReportDetails.exists ? mergedReportDetails : legacyReportDetails;
  const termDetails = parseTermDetailsSheet(workbook);

  return {
    headers,
    rows,
    subjectColumns: Array.from(subjectColumnsByName.values()),
    unknownSubjectColumns,
    missingIdentityHeaders,
    reportDetailsRows: reportDetails.rows,
    hasReportDetailsSheet: reportDetails.exists,
    termDetails: termDetails.details,
    hasTermDetailsSheet: termDetails.exists,
    reportDetailErrors: reportDetails.errors,
    termDetailErrors: termDetails.errors,
  };
}

export function normalizeTemplateSubjectName(value: string) {
  return normalizeSubjectName(value);
}
