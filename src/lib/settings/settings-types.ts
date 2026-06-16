import { z } from "zod";

import { DEFAULT_GRADING_SCALE } from "@/lib/settings/default-grading-scale";
import { DEFAULT_REPORT_SETTINGS } from "@/lib/settings/report-settings-defaults";
import type { AppRole, Json, TableRow } from "@/types/database";

export type SettingsActionState<T = undefined> = {
  ok: boolean;
  message: string;
  data?: T;
  fieldErrors?: Record<string, string[]>;
};

export type SchoolSettings = {
  school: TableRow<"schools">;
  profile: SchoolProfileInput;
  branding: BrandingInput;
  reportSettings: ReportSettingsInput;
  gradingScale: GradingScaleInput["bands"];
};

export type SchoolUser = Pick<TableRow<"users">, "id" | "full_name" | "email" | "role" | "is_active" | "created_at" | "metadata">;
export type SchoolInvitation = Pick<TableRow<"staff_invitations">, "id" | "full_name" | "email" | "role" | "status" | "expires_at" | "created_at" | "token">;
export type SchoolStaff = TableRow<"school_staff">;
export type SchoolClassAssignment = {
  id: string;
  name: string;
  academicYear: string;
  isActive: boolean;
  classTeacherStaffId: string;
};

export const schoolProfileSchema = z.object({
  name: z.string().min(2, "School name is required."),
  schoolType: z.string().max(80).optional(),
  motto: z.string().max(180).optional(),
  address: z.string().max(220).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  country: z.string().min(2, "Country is required."),
  phone: z.string().max(40).optional(),
  email: z.string().email("Enter a valid email.").optional().or(z.literal("")),
  website: z.string().url("Enter a valid website URL.").optional().or(z.literal("")),
  principalName: z.string().max(120).optional(),
});

export const brandingSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal("")),
  sealUrl: z.string().url().optional().or(z.literal("")),
  principalSignatureUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a valid hex color."),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a valid hex color."),
});

export const reportSettingsSchema = z.object({
  reportTitle: z.string().min(3, "Report title is required.").max(120),
  showSchoolMotto: z.boolean(),
  showStudentCode: z.boolean(),
  showAdmissionNumber: z.boolean(),
  showClassPosition: z.boolean(),
  showGradingGuide: z.boolean(),
  showPerformanceSummary: z.boolean(),
  footerNote: z.string().max(220).optional(),
  principalComment: z.string().max(240).optional(),
  classTeacherComment: z.string().max(240).optional(),
  nextTermBegins: z.string().optional(),
});

export const gradingBandSchema = z.object({
  min: z.number().min(0).max(100),
  max: z.number().min(0).max(100),
  grade: z.string().min(1).max(8),
  remark: z.string().min(1).max(80),
});

export const gradingScaleSchema = z.object({
  bands: z.array(gradingBandSchema).min(1),
});

export const userRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "headmaster", "teacher"]),
});

export const userStatusSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.boolean(),
});

export type SchoolProfileInput = z.infer<typeof schoolProfileSchema>;
export type BrandingInput = z.infer<typeof brandingSchema>;
export type ReportSettingsInput = z.infer<typeof reportSettingsSchema>;
export type GradingScaleInput = z.infer<typeof gradingScaleSchema>;

export function isJsonObject(value: Json): value is Record<string, Json | undefined> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function getMetadataObject(value: Json): Record<string, Json | undefined> {
  return isJsonObject(value) ? value : {};
}

export function getMetadataString(metadata: Record<string, Json | undefined>, key: string, fallback = "") {
  const value = metadata[key];

  return typeof value === "string" ? value : fallback;
}

export function getReportSettings(metadata: Record<string, Json | undefined>): ReportSettingsInput {
  const settings = getMetadataObject(metadata.report_settings ?? null);

  return {
    ...DEFAULT_REPORT_SETTINGS,
    ...settings,
  } as ReportSettingsInput;
}

export function getGradingScale(metadata: Record<string, Json | undefined>): GradingScaleInput["bands"] {
  return Array.isArray(metadata.grading_scale) ? (metadata.grading_scale as GradingScaleInput["bands"]) : DEFAULT_GRADING_SCALE;
}

export function normalizeRole(role: AppRole): "admin" | "headmaster" | "teacher" {
  return role === "admin" || role === "headmaster" ? role : "teacher";
}
