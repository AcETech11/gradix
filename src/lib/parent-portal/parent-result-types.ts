import type { SchoolTerm } from "@/types/database";
import type { GradingBand } from "@/lib/settings/default-grading-scale";
import type { ReportSettings } from "@/lib/settings/report-settings-defaults";

export type ParentResultRow = {
  subject: string;
  ca: number;
  exam: number;
  total: number;
  grade: string;
  remark: string | null;
  position: number | null;
};

export type ParentTermOption = {
  term: SchoolTerm;
  academicYear: string;
  classId: string;
  publishedAt: string | null;
  label: string;
};

export type PublicResultPayload = {
  ok: true;
  school: {
    name: string;
    logoUrl: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    motto: string | null;
    principalName: string | null;
    principalSignatureUrl: string | null;
    sealUrl?: string | null;
    reportSettings?: Partial<ReportSettings> | null;
    gradingScale?: GradingBand[] | null;
  };
  student: {
    name: string;
    code: string;
    admissionNumber: string | null;
  };
  result: {
    term: SchoolTerm;
    academicYear: string;
    className: string;
    publishedAt: string | null;
    rows: ParentResultRow[];
  };
  termOptions: ParentTermOption[];
  access: {
    useCount: number;
    maxUses: number;
    remaining: number;
  };
};

export type PublicResultError = {
  ok: false;
  reason: "invalid_code" | "no_published_result" | "access_limit" | "school_unavailable" | "database_error";
  message: string;
};

export type PublicResultResponse = PublicResultPayload | PublicResultError;

export type ResultSummary = {
  totalScore: number;
  averageScore: number;
  highestSubject: ParentResultRow | null;
  lowestSubject: ParentResultRow | null;
  subjectCount: number;
  overallGrade: string;
};
