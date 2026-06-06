import type { ParentResultRow } from "@/lib/parent-portal/parent-result-types";
import { reportGradeFromScore } from "@/lib/pdf/grade-scale";
import type { ReportSummary } from "@/lib/pdf/report-types";

function remarkFromAverage(average: number) {
  if (average >= 70) return "Excellent performance";
  if (average >= 60) return "Good performance";
  if (average >= 50) return "Credit-level performance";
  if (average >= 40) return "Pass performance";
  return "Needs urgent academic support";
}

export function calculateReportSummary(rows: ParentResultRow[]): ReportSummary {
  const totalScore = rows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const averageScore = rows.length ? totalScore / rows.length : 0;
  const sortedRows = [...rows].sort((first, second) => Number(second.total) - Number(first.total));

  return {
    subjectCount: rows.length,
    totalScore,
    averageScore,
    highestSubject: sortedRows[0] ?? null,
    lowestSubject: sortedRows[sortedRows.length - 1] ?? null,
    overallGrade: reportGradeFromScore(averageScore),
    performanceRemark: remarkFromAverage(averageScore),
  };
}
