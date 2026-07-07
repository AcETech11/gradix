import type { TableRow } from "@/types/database";

export type StudentStatus = "active" | "inactive" | "repeated" | "graduated" | "transferred" | "withdrawn" | "archived";

export type StudentRecord = TableRow<"students">;

export type StudentProfile = StudentRecord & {
  student_code: string;
  parent_name: string | null;
};

export type StudentListItem = StudentProfile & {
  class_name: string | null;
  class_level: string | null;
};

export type StudentFormValues = {
  fullName: string;
  classId: string;
};

export type StudentImportRow = {
  studentName: string;
  className: string;
};

export type StudentImportPreviewRow = StudentImportRow & {
  rowNumber: number;
  issues: string[];
  classId: string | null;
};

export type StudentImportSummary = {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  ready: number;
};

export type StudentFilters = {
  query?: string;
  classId?: string;
  status?: StudentStatus | "all";
  page?: number;
};
