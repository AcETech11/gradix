import type { ParentResultRow, ResultSummary } from "@/lib/parent-portal/parent-result-types";

function overallGradeFromAverage(average: number) {
  if (average >= 70) return "A";
  if (average >= 60) return "B";
  if (average >= 50) return "C";
  if (average >= 40) return "D";
  return "F";
}

export function calculateResultSummary(rows: ParentResultRow[]): ResultSummary {
  // Exclude placeholder/not offered subjects where both CA and Exam scores are zero
  const realRows = rows.filter(
    (row) => !(Number(row.ca ?? 0) === 0 && Number(row.exam ?? 0) === 0)
  );

  const totalScore = realRows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const averageScore = realRows.length ? totalScore / realRows.length : 0;
  const sorted = [...realRows].sort((first, second) => Number(second.total) - Number(first.total));

  return {
    totalScore,
    averageScore,
    highestSubject: sorted[0] ?? null,
    lowestSubject: sorted[sorted.length - 1] ?? null,
    subjectCount: realRows.length,
    overallGrade: overallGradeFromAverage(averageScore),
  };
}
