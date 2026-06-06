"use server";

import { average, calculatePassRate } from "@/lib/analytics/calculate-pass-rate";
import type { SubjectPerformanceRow } from "@/lib/analytics/analytics-types";

import { getAnalyticsSourceData } from "./analytics-source";

export async function getSubjectPerformanceAction(input?: unknown): Promise<SubjectPerformanceRow[]> {
  const data = await getAnalyticsSourceData(input);
  const subjectMap = new Map(data.subjects.map((subject) => [subject.id, subject]));

  return Array.from(new Set(data.publishedResults.map((result) => result.subject_id)))
    .map((subjectId) => {
      const subjectResults = data.publishedResults.filter((result) => result.subject_id === subjectId);
      const scores = subjectResults.map((result) => result.total_score);

      return {
        subjectId,
        subjectName: subjectMap.get(subjectId)?.name ?? "Unknown subject",
        averageScore: average(scores),
        highestScore: scores.length ? Math.max(...scores) : 0,
        lowestScore: scores.length ? Math.min(...scores) : 0,
        passRate: calculatePassRate(scores),
        studentCount: new Set(subjectResults.map((result) => result.student_id)).size,
      };
    })
    .sort((first, second) => second.averageScore - first.averageScore);
}
