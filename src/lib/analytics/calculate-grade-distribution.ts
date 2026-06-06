import type { GradeDistributionItem } from "@/lib/analytics/analytics-types";

export function gradeFromScore(score: number): GradeDistributionItem["grade"] {
  if (score >= 70) {
    return "A";
  }

  if (score >= 60) {
    return "B";
  }

  if (score >= 50) {
    return "C";
  }

  if (score >= 40) {
    return "D";
  }

  return "F";
}

export function calculateGradeDistribution(scores: number[]): GradeDistributionItem[] {
  const counts: Record<GradeDistributionItem["grade"], number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    F: 0,
  };

  for (const score of scores) {
    counts[gradeFromScore(score)] += 1;
  }

  return Object.entries(counts).map(([grade, count]) => ({
    grade: grade as GradeDistributionItem["grade"],
    count,
  }));
}
