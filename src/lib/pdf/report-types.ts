import type { ParentResultRow, PublicResultPayload } from "@/lib/parent-portal/parent-result-types";
import type { GradingBand } from "@/lib/settings/default-grading-scale";
import type { ReportSettings } from "@/lib/settings/report-settings-defaults";
import type { ClassTermReportDetails, ComprehensiveReportDetails } from "@/lib/reports/primary-report";

export type PrintableReportData = PublicResultPayload & {
  printedAt: string;
  principalName: string;
  principalSignatureUrl: string | null;
  principalComment: string;
  classTeacherName: string;
  classTeacherSignatureUrl: string | null;
  classTeacherComment: string;
  reportSettings: ReportSettings;
  gradingScale: GradingBand[];
  comprehensive: ComprehensiveReportDetails & ClassTermReportDetails;
};

export type ReportSummary = {
  subjectCount: number;
  totalScore: number;
  averageScore: number;
  highestSubject: ParentResultRow | null;
  lowestSubject: ParentResultRow | null;
  overallGrade: string;
  performanceRemark: string;
};
