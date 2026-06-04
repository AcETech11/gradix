import type { TableRow } from "@/types/database";

export type StudentStatus = "active" | "inactive" | "graduated" | "archived";
export type StudentGender = "male" | "female" | "other";

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
  firstName: string;
  lastName: string;
  middleName: string;
  gender: StudentGender;
  dateOfBirth: string;
  classId: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  admissionNumber: string;
  status: StudentStatus;
  passportUrl: string;
};

export type StudentImportRow = {
  studentCode?: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: StudentGender;
  className: string;
  parentName: string;
  parentPhone: string;
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
