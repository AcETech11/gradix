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
  // Exclude placeholder/not offered subjects where both CA and Exam scores are zero
  const realRows = rows.filter(
    (row) => !(Number(row.ca ?? 0) === 0 && Number(row.exam ?? 0) === 0)
  );

  const totalScore = realRows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const averageScore = realRows.length ? totalScore / realRows.length : 0;
  const sortedRows = [...realRows].sort((first, second) => Number(second.total) - Number(first.total));

  return {
    subjectCount: realRows.length,
    totalScore,
    averageScore,
    highestSubject: sortedRows[0] ?? null,
    lowestSubject: sortedRows[sortedRows.length - 1] ?? null,
    overallGrade: reportGradeFromScore(averageScore),
    performanceRemark: remarkFromAverage(averageScore),
  };
}
