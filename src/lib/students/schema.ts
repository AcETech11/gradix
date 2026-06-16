import { z } from "zod";

import type { StudentGender, StudentStatus } from "@/types/students";

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number is required.")
  .max(20, "Use a valid phone number.")
  .regex(/^[+0-9()\-\s]+$/, "Use digits and standard phone characters only.");

const statusValues: StudentStatus[] = ["active", "inactive", "repeated", "graduated", "transferred", "withdrawn", "archived"];

export const studentFormSchema = z.object({
  firstName: z.string().trim().min(2, "First name is required."),
  lastName: z.string().trim().min(2, "Last name is required."),
  middleName: z.string().trim().optional().default(""),
  gender: z.enum(["male", "female", "other"] satisfies [StudentGender, ...StudentGender[]]),
  dateOfBirth: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), "Enter a valid date."),
  classId: z.string().uuid("Choose a class."),
  parentName: z.string().trim().min(2, "Parent name is required."),
  parentPhone: phoneSchema,
  parentEmail: z.string().trim().email("Enter a valid email.").optional().default(""),
  admissionNumber: z.string().trim().optional().default(""),
  status: z.enum(statusValues as [StudentStatus, ...StudentStatus[]]).default("active"),
  passportUrl: z.string().trim().optional().default(""),
});

export const studentFiltersSchema = z.object({
  query: z.string().trim().optional().default(""),
  classId: z.union([z.string().uuid(), z.literal("")]).default(""),
  status: z.enum(["all", ...statusValues] as ["all", ...StudentStatus[]]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
});

export const studentImportRowSchema = z.object({
  studentName: z.string().trim().min(2, "Student name is required."),
  admissionNumber: z.string().trim().min(1, "Admission number is required."),
  gender: z.union([z.enum(["male", "female", "other"] satisfies [StudentGender, ...StudentGender[]]), z.literal("")]).optional().default(""),
  dateOfBirth: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), "Enter a valid date of birth."),
  className: z.string().trim().min(1, "Class is required."),
  parentName: z.string().trim().optional().default(""),
  parentPhone: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((value) => !value || /^[+0-9()\-\s]+$/.test(value), "Use a valid parent phone."),
  parentEmail: z.string().trim().email("Enter a valid parent email.").optional().or(z.literal("")).default(""),
  address: z.string().trim().optional().default(""),
});

export const studentImportRowsSchema = z.array(studentImportRowSchema);

export type StudentFormInput = z.input<typeof studentFormSchema>;
export type StudentFormValues = z.infer<typeof studentFormSchema>;
export type StudentFiltersInput = z.infer<typeof studentFiltersSchema>;
export type StudentImportRowInput = z.infer<typeof studentImportRowSchema>;
export type StudentImportRowsInput = z.infer<typeof studentImportRowsSchema>;
