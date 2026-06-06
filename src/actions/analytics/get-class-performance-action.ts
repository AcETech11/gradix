"use server";

import { average, calculatePassRate } from "@/lib/analytics/calculate-pass-rate";
import type { ClassPerformanceRow } from "@/lib/analytics/analytics-types";

import { getAnalyticsSourceData } from "./analytics-source";

export async function getClassPerformanceAction(input?: unknown): Promise<ClassPerformanceRow[]> {
  const data = await getAnalyticsSourceData(input);
  const classMap = new Map(data.classes.map((schoolClass) => [schoolClass.id, schoolClass]));
  const subjectMap = new Map(data.subjects.map((subject) => [subject.id, subject]));
  const studentCounts = new Map<string, number>();

  for (const student of data.students) {
    if (student.class_id && student.is_active && student.status === "active") {
      studentCounts.set(student.class_id, (studentCounts.get(student.class_id) ?? 0) + 1);
    }
  }

  return data.classes
    .map((schoolClass) => {
      const classResults = data.publishedResults.filter((result) => result.class_id === schoolClass.id);
      const subjectAverages = Array.from(new Set(classResults.map((result) => result.subject_id)))
        .map((subjectId) => {
          const subjectResults = classResults.filter((result) => result.subject_id === subjectId);

          return {
            subjectName: subjectMap.get(subjectId)?.name ?? "Unknown subject",
            averageScore: average(subjectResults.map((result) => result.total_score)),
          };
        })
        .sort((first, second) => second.averageScore - first.averageScore);

      return {
        classId: schoolClass.id,
        className: classMap.get(schoolClass.id)?.name ?? schoolClass.name,
        totalStudents: studentCounts.get(schoolClass.id) ?? 0,
        averageScore: average(classResults.map((result) => result.total_score)),
        passRate: calculatePassRate(classResults.map((result) => result.total_score)),
        highestAverageSubject: subjectAverages[0]?.subjectName ?? "No data",
        lowestAverageSubject: subjectAverages.at(-1)?.subjectName ?? "No data",
      };
    })
    .filter((row) => row.totalStudents > 0 || row.averageScore > 0);
}
