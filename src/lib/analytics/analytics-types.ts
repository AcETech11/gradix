import { z } from "zod";

import type { SchoolTerm, UploadStatus } from "@/types/database";

export const analyticsFilterSchema = z.object({
  academicYear: z.preprocess((value) => (value === "" ? undefined : value), z.string().optional()),
  term: z.preprocess((value) => (value === "" ? undefined : value), z.enum(["first", "second", "third"]).optional()),
  classId: z.preprocess((value) => (value === "" ? undefined : value), z.string().optional()),
  subjectId: z.preprocess((value) => (value === "" ? undefined : value), z.string().optional()),
});

export type AnalyticsFilters = z.infer<typeof analyticsFilterSchema>;

export type AnalyticsFilterOption = {
  value: string;
  label: string;
};

export type AnalyticsFilterOptions = {
  academicYears: AnalyticsFilterOption[];
  terms: AnalyticsFilterOption[];
  classes: AnalyticsFilterOption[];
  subjects: AnalyticsFilterOption[];
  defaults: {
    academicYear?: string;
    term?: SchoolTerm;
  };
};

export type AnalyticsOverview = {
  totalStudents: number;
  activeClasses: number;
  publishedResults: number;
  pendingUploads: number;
  parentResultChecks: number;
  averageScore: number;
};

export type ClassPerformanceRow = {
  classId: string;
  className: string;
  totalStudents: number;
  averageScore: number;
  passRate: number;
  highestAverageSubject: string;
  lowestAverageSubject: string;
};

export type SubjectPerformanceRow = {
  subjectId: string;
  subjectName: string;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  studentCount: number;
};

export type GradeDistributionItem = {
  grade: "A" | "B" | "C" | "D" | "F";
  count: number;
};

export type ParentAccessAnalytics = {
  totalViews: number;
  uniqueStudentsChecked: number;
  mostCheckedClass: string;
  codesAtLimit: number;
  recentChecks: Array<{
    id: string;
    studentName: string;
    className: string;
    usedAt: string;
    useCount: number;
  }>;
};

export type UploadActivity = {
  uploadsThisTerm: number;
  publishedUploads: number;
  draftUploads: number;
  archivedUploads: number;
  recentUploads: Array<{
    id: string;
    className: string;
    term: SchoolTerm;
    academicYear: string;
    status: UploadStatus;
    uploadedAt: string;
    fileName: string;
  }>;
};
