"use server";

import { average } from "@/lib/analytics/calculate-pass-rate";
import type { AnalyticsOverview } from "@/lib/analytics/analytics-types";

import { getAnalyticsSourceData } from "./analytics-source";

export async function getAnalyticsOverviewAction(input?: unknown): Promise<AnalyticsOverview> {
  const data = await getAnalyticsSourceData(input);

  return {
    totalStudents: data.students.filter((student) => student.is_active && student.status === "active").length,
    activeClasses: data.classes.length,
    totalSubjects: data.subjects.length,
    publishedResults: data.publishedResults.length,
    pendingUploads: data.uploads.filter((upload) => upload.status === "draft" || upload.status === "validating" || upload.status === "validated").length,
    parentResultChecks: data.parentAccess.reduce((sum, access) => sum + access.use_count, 0),
    averageScore: average(data.publishedResults.map((result) => result.total_score)),
  };
}

export async function getAnalyticsFilterOptionsAction(input?: unknown) {
  const data = await getAnalyticsSourceData(input);

  return data.filterOptions;
}
