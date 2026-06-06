import type { ParentResultRow, PublicResultPayload } from "@/lib/parent-portal/parent-result-types";
import type { GradingBand } from "@/lib/settings/default-grading-scale";
import type { ReportSettings } from "@/lib/settings/report-settings-defaults";

export type PrintableReportData = PublicResultPayload & {
  printedAt: string;
  principalName: string;
  principalSignatureUrl: string | null;
  reportSettings: ReportSettings;
  gradingScale: GradingBand[];
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
