import { z } from "zod";

import type { StudentStatus } from "@/types/students";

const statusValues: StudentStatus[] = ["active", "inactive", "repeated", "graduated", "transferred", "withdrawn", "archived"];

export const studentFormSchema = z.object({
  fullName: z.string().trim().min(2, "Student name is required."),
  classId: z.string().uuid("Choose a class."),
});

export const studentFiltersSchema = z.object({
  query: z.string().trim().optional().default(""),
  classId: z.union([z.string().uuid(), z.literal("")]).default(""),
  status: z.enum(["all", ...statusValues] as ["all", ...StudentStatus[]]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
});

export const studentImportRowSchema = z.object({
  studentName: z.string().trim().min(2, "Student name is required."),
  className: z.string().trim().min(1, "Class is required."),
});

export const studentImportRowsSchema = z.array(studentImportRowSchema);

export type StudentFormInput = z.input<typeof studentFormSchema>;
export type StudentFormValues = z.infer<typeof studentFormSchema>;
export type StudentFiltersInput = z.infer<typeof studentFiltersSchema>;
export type StudentImportRowInput = z.infer<typeof studentImportRowSchema>;
export type StudentImportRowsInput = z.infer<typeof studentImportRowsSchema>;
