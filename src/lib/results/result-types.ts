import { z } from "zod";

import { AFFECTIVE_TRAITS, PSYCHOMOTOR_TRAITS } from "@/lib/reports/primary-report";
import type { SchoolTerm, UploadStatus } from "@/types/database";

export const resultScoreSchema = z.object({
  resultId: z.string().uuid(),
  continuousAssessment: z.coerce.number().min(0, "CA must be at least 0.").max(40, "CA must be 0 to 40."),
  examScore: z.coerce.number().min(0, "Exam must be at least 0.").max(60, "Exam must be 0 to 60."),
  remark: z.string().trim().max(240, "Remark is too long.").optional(),
  reasonForEdit: z.string().trim().optional(),
});

export const classTeacherCommentSchema = z.object({
  uploadId: z.string().uuid(),
  studentId: z.string().uuid(),
  comment: z.string().trim().max(240, "Comment is too long."),
});

export const reportDetailsSchema = z.object({
  uploadId: z.string().uuid(),
  studentId: z.string().uuid(),
  attendancePresent: z.coerce.number().int().min(0).nullable().optional(),
  attendanceAbsent: z.coerce.number().int().min(0).nullable().optional(),
  classTeacherComment: z.string().trim().max(240, "Comment is too long.").optional(),
  reasonForEdit: z.string().trim().optional(),
  affectiveDomain: z.object(Object.fromEntries(AFFECTIVE_TRAITS.map((trait) => [trait, z.coerce.number().int().min(1).max(5).nullable().optional()]))),
  psychomotorDomain: z.object(Object.fromEntries(PSYCHOMOTOR_TRAITS.map((trait) => [trait, z.coerce.number().int().min(1).max(5).nullable().optional()]))),
});

export const classTermReportSettingsSchema = z.object({
  uploadId: z.string().uuid(),
  schoolOpenDays: z.coerce.number().int().min(0).nullable().optional(),
  termEndsOn: z.string().optional().or(z.literal("")),
  nextTermBeginsOn: z.string().optional().or(z.literal("")),
});

export type ResultScoreInput = z.infer<typeof resultScoreSchema>;
export type ResultScoreFormValues = z.input<typeof resultScoreSchema>;
export type ReportDetailsInput = z.infer<typeof reportDetailsSchema>;
export type ReportDetailsFormValues = z.input<typeof reportDetailsSchema>;
export type ClassTermReportSettingsInput = z.infer<typeof classTermReportSettingsSchema>;

export type ResultUploadListItem = {
  id: string;
  classId: string;
  className: string;
  term: SchoolTerm;
  academicYear: string;
  status: UploadStatus;
  totalRows: number;
  totalStudents: number;
  uploadedBy: string;
  uploadedDate: string;
  publishedDate: string | null;
  sourceFilename: string;
  canReview: boolean;
  canPublish: boolean;
  canUnpublish: boolean;
  canArchive: boolean;
};

export type ResultReviewRow = {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  admissionNumber: string | null;
  subjectId: string;
  subjectName: string;
  continuousAssessment: number;
  examScore: number;
  totalScore: number;
  grade: string;
  remark: string | null;
  isPublished: boolean;
  editedBy: string | null;
  editedAt: string | null;
  editCount: number;
  editedAfterPublish: boolean;
  classTeacherComment: string | null;
  attendancePresent: number | null;
  attendanceAbsent: number | null;
  affectiveDomain: Record<string, number | undefined>;
  psychomotorDomain: Record<string, number | undefined>;
  parentAccessUseCount: number | null;
  parentAccessMaxUses: number | null;
};

export type ResultUploadDetail = {
  id: string;
  classId: string;
  className: string;
  term: SchoolTerm;
  academicYear: string;
  status: UploadStatus;
  sourceFilename: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  uploadedBy: string;
  uploadedDate: string;
  publishedDate: string | null;
  canEdit: boolean;
  canPublish: boolean;
  canUnpublish: boolean;
  canArchive: boolean;
  canEditReportDetails: boolean;
  schoolOpenDays: number | null;
  termEndsOn: string | null;
  nextTermBeginsOn: string | null;
  schoolName: string;
  schoolSlug: string | null;
  schoolLogoUrl: string | null;
};

export type ResultActionState<TData = unknown> =
  | {
      ok: true;
      message: string;
      data?: TData;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };
