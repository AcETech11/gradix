"use server";

import { calculateGradeDistribution } from "@/lib/analytics/calculate-grade-distribution";

import { getAnalyticsSourceData } from "./analytics-source";

export async function getGradeDistributionAction(input?: unknown) {
  const data = await getAnalyticsSourceData(input);

  return calculateGradeDistribution(data.publishedResults.map((result) => result.total_score));
}
