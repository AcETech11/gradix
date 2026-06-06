"use server";

import type { ParentAccessAnalytics } from "@/lib/analytics/analytics-types";

import { getAnalyticsSourceData } from "./analytics-source";

function studentName(student: { first_name: string; middle_name: string | null; last_name: string }) {
  return [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ");
}

export async function getParentAccessAnalyticsAction(input?: unknown): Promise<ParentAccessAnalytics> {
  const data = await getAnalyticsSourceData(input);
  const studentMap = new Map(data.students.map((student) => [student.id, student]));
  const classMap = new Map(data.classes.map((schoolClass) => [schoolClass.id, schoolClass.name]));
  const classViews = new Map<string, number>();

  for (const access of data.parentAccess) {
    const student = studentMap.get(access.student_id);
    const classId = student?.class_id;

    if (classId) {
      classViews.set(classId, (classViews.get(classId) ?? 0) + access.use_count);
    }
  }

  const mostCheckedClassId = Array.from(classViews.entries()).sort((first, second) => second[1] - first[1])[0]?.[0];

  return {
    totalViews: data.parentAccess.reduce((sum, access) => sum + access.use_count, 0),
    uniqueStudentsChecked: new Set(data.parentAccess.filter((access) => access.use_count > 0).map((access) => access.student_id)).size,
    mostCheckedClass: mostCheckedClassId ? classMap.get(mostCheckedClassId) ?? "Unknown class" : "No checks yet",
    codesAtLimit: data.parentAccess.filter((access) => access.max_uses !== null && access.use_count >= access.max_uses).length,
    recentChecks: data.parentAccess
      .filter((access) => Boolean(access.last_used_at))
      .slice(0, 5)
      .map((access) => {
        const student = studentMap.get(access.student_id);

        return {
          id: access.id,
          studentName: student ? studentName(student) : "Unknown student",
          className: student?.class_id ? classMap.get(student.class_id) ?? "Unknown class" : "No class",
          usedAt: access.last_used_at as string,
          useCount: access.use_count,
        };
      }),
  };
}
