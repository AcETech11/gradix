import type { SchoolTerm, StudentStatus } from "@/types/database";

export type PromotionClassOption = {
  id: string;
  name: string;
  academicYear: string;
  studentCount: number;
};

export type PromotionStudent = {
  id: string;
  studentCode: string;
  admissionNumber: string | null;
  name: string;
  classId: string | null;
  className: string;
  status: StudentStatus;
  isActive: boolean;
  hasTargetEnrollment: boolean;
};

export type PromotionOverview = {
  currentAcademicYear: string;
  currentTerm: SchoolTerm;
  nextAcademicYear: string;
  activeStudents: number;
  activeClasses: number;
};

export type PromotionActivity = {
  id: string;
  action: string;
  details: Record<string, unknown>;
  createdAt: string;
};

export type PromotionPageData = {
  overview: PromotionOverview;
  classes: PromotionClassOption[];
  students: PromotionStudent[];
  recentActivity: PromotionActivity[];
  selected: {
    fromAcademicYear: string;
    toAcademicYear: string;
    fromClassId: string;
    toClassId: string;
  };
};

export type PromotionActionState<T = undefined> = {
  ok: boolean;
  message: string;
  data?: T;
  fieldErrors?: Record<string, string[] | undefined>;
};
