import { z } from "zod";

import type { SchoolTerm } from "@/types/database";
import type { ClassTermReportDetails, TraitRatingMap } from "@/lib/reports/primary-report";

export const duplicateStrategies = ["skip", "replace"] as const;

export const uploadValidationSchema = z.object({
  classId: z.string().uuid("Select a class."),
  term: z.enum(["first", "second", "third"]),
  academicYear: z.string().regex(/^[0-9]{4}\/[0-9]{4}$/, "Use an academic year like 2025/2026."),
  fileName: z.string().min(1, "Upload an Excel file."),
  fileBase64: z.string().min(1, "Upload an Excel file."),
  duplicateStrategy: z.enum(duplicateStrategies).default("skip"),
});

export type DuplicateStrategy = (typeof duplicateStrategies)[number];
export type UploadValidationInput = z.infer<typeof uploadValidationSchema>;
export type UploadValidationFormValues = z.input<typeof uploadValidationSchema>;

export type UploadClassOption = {
  id: string;
  name: string;
  academicYear: string;
  subjectCount: number;
  studentCount: number;
};

export type UploadSubject = {
  id: string;
  name: string;
  code: string;
};

export type UploadStudent = {
  id: string;
  permanentCode: string;
  admissionNumber: string | null;
  name: string;
};

export type ParsedSubjectColumns = {
  subjectName: string;
  caHeader?: string;
  examHeader?: string;
  remarkHeader?: string;
};

export type ParsedTemplateRow = {
  rowNumber: number;
  studentCode: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  classTeacherComment: string;
  values: Record<string, string | number | null>;
};

export type ParsedReportDetailsRow = {
  rowNumber: number;
  studentCode: string;
  studentName: string;
  attendancePresent: number | null;
  attendanceAbsent: number | null;
  affectiveDomain: TraitRatingMap;
  psychomotorDomain: TraitRatingMap;
  classTeacherComment: string;
  values: Record<string, string | number | null>;
};

export type ParsedResultTemplate = {
  headers: string[];
  rows: ParsedTemplateRow[];
  subjectColumns: ParsedSubjectColumns[];
  unknownSubjectColumns: string[];
  missingIdentityHeaders: string[];
  reportDetailsRows: ParsedReportDetailsRow[];
  hasReportDetailsSheet: boolean;
  termDetails: ClassTermReportDetails | null;
  hasTermDetailsSheet: boolean;
  reportDetailErrors: string[];
  termDetailErrors: string[];
};

export type UploadPreviewStatus = "valid" | "warning" | "duplicate" | "invalid";

export type UploadPreviewRow = {
  rowId: string;
  rowNumber: number;
  status: UploadPreviewStatus;
  studentId?: string;
  studentCode: string;
  studentName: string;
  admissionNumber: string;
  subjectId?: string;
  subjectName: string;
  ca: number | null;
  exam: number | null;
  total: number | null;
  grade: string;
  remark: string;
  classTeacherComment: string;
  attendancePresent: number | null;
  attendanceAbsent: number | null;
  affectiveDomain: TraitRatingMap;
  psychomotorDomain: TraitRatingMap;
  errors: string[];
  warnings: string[];
  isExistingDuplicate: boolean;
};

export type UploadValidationSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  warningRows: number;
  studentsFound: number;
  subjectsFound: number;
  messages: string[];
};

export type UploadValidationResult = {
  ok: true;
  className: string;
  term: SchoolTerm;
  academicYear: string;
  duplicateStrategy: DuplicateStrategy;
  rows: UploadPreviewRow[];
  summary: UploadValidationSummary;
};

export type UploadActionState =
  | UploadValidationResult
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export type SaveUploadState =
  | {
      ok: true;
      message: string;
      uploadId: string;
      insertedRows: number;
      replacedRows: number;
      skippedRows: number;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };
