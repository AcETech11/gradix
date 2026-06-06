import { z } from "zod";

import type { SchoolTerm, UploadStatus } from "@/types/database";

export const resultScoreSchema = z.object({
  resultId: z.string().uuid(),
  continuousAssessment: z.coerce.number().min(0, "CA must be at least 0.").max(40, "CA must be 0 to 40."),
  examScore: z.coerce.number().min(0, "Exam must be at least 0.").max(60, "Exam must be 0 to 60."),
  remark: z.string().trim().max(240, "Remark is too long.").optional(),
});

export type ResultScoreInput = z.infer<typeof resultScoreSchema>;
export type ResultScoreFormValues = z.input<typeof resultScoreSchema>;

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
