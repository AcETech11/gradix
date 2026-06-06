import type { AppRole, SchoolTerm } from "@/types/database";

export type ParentAccessStatus = "all" | "not_checked" | "checked" | "limit_reached" | "no_published_result";

export type ParentAccessFilters = {
  academicYear?: string;
  term?: SchoolTerm;
  classId?: string;
  status?: ParentAccessStatus;
};

export type ParentAccessClassOption = {
  id: string;
  name: string;
};

export type ParentAccessRecord = {
  studentId: string;
  studentName: string;
  studentCode: string;
  admissionNumber: string | null;
  classId: string | null;
  className: string;
  term: SchoolTerm;
  academicYear: string;
  viewsUsed: number;
  maxViews: number;
  viewsRemaining: number;
  lastCheckedAt: string | null;
  status: Exclude<ParentAccessStatus, "all">;
  accessId: string | null;
};

export type ParentAccessOverview = {
  totalViews: number;
  studentsChecked: number;
  studentsNotChecked: number;
  limitReached: number;
  activeResultCodes: number;
};

export type ParentAccessActivity = {
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  term: SchoolTerm;
  academicYear: string;
  useCount: number;
  lastCheckedAt: string;
};

export type ParentAccessPageData = {
  profile: {
    id: string;
    role: AppRole;
    schoolId: string;
  };
  filters: Required<Pick<ParentAccessFilters, "status">> & Omit<ParentAccessFilters, "status">;
  overview: ParentAccessOverview;
  records: ParentAccessRecord[];
  recentActivity: ParentAccessActivity[];
  classOptions: ParentAccessClassOption[];
  academicYears: string[];
  termOptions: SchoolTerm[];
  hasPublishedResults: boolean;
};

export type ParentAccessActionState<T = undefined> = {
  ok: boolean;
  message: string;
  data?: T;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type ParentAccessExportResult =
  | {
      ok: true;
      fileName: string;
      mimeType: string;
      base64: string;
    }
  | {
      ok: false;
      message: string;
    };
