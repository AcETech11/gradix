import type { ParentResultRow, ResultSummary } from "@/lib/parent-portal/parent-result-types";

function overallGradeFromAverage(average: number) {
  if (average >= 70) return "A";
  if (average >= 60) return "B";
  if (average >= 50) return "C";
  if (average >= 40) return "D";
  return "F";
}

export function calculateResultSummary(rows: ParentResultRow[]): ResultSummary {
  const totalScore = rows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const averageScore = rows.length ? totalScore / rows.length : 0;
  const sorted = [...rows].sort((first, second) => Number(second.total) - Number(first.total));

  return {
    totalScore,
    averageScore,
    highestSubject: sorted[0] ?? null,
    lowestSubject: sorted[sorted.length - 1] ?? null,
    subjectCount: rows.length,
    overallGrade: overallGradeFromAverage(averageScore),
  };
}
