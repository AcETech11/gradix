import { redirect } from "next/navigation";

import { getClassPerformanceAction } from "@/actions/analytics/get-class-performance-action";
import { getGradeDistributionAction } from "@/actions/analytics/get-grade-distribution-action";
import { getAnalyticsFilterOptionsAction, getAnalyticsOverviewAction } from "@/actions/analytics/get-analytics-overview-action";
import { getParentAccessAnalyticsAction } from "@/actions/analytics/get-parent-access-analytics-action";
import { getSubjectPerformanceAction } from "@/actions/analytics/get-subject-performance-action";
import { getUploadActivityAction } from "@/actions/analytics/get-upload-activity-action";
import { AnalyticsEmptyState } from "@/components/analytics/AnalyticsEmptyState";
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters";
import { AnalyticsOverviewCards } from "@/components/analytics/AnalyticsOverviewCards";
import { ClassPerformanceChart } from "@/components/analytics/ClassPerformanceChart";
import { GradeDistributionChart } from "@/components/analytics/GradeDistributionChart";
import { ParentAccessInsights } from "@/components/analytics/ParentAccessInsights";
import { SubjectPerformanceChart } from "@/components/analytics/SubjectPerformanceChart";
import { UploadActivityPanel } from "@/components/analytics/UploadActivityPanel";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { analyticsFilterSchema, type AnalyticsFilters as AnalyticsFilterValues } from "@/lib/analytics/analytics-types";

type AnalyticsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function resolveFilters(searchParams?: Promise<Record<string, string | string[] | undefined>>): Promise<AnalyticsFilterValues> {
  const params = searchParams ? await searchParams : {};

  const parsed = analyticsFilterSchema.safeParse({
    academicYear: firstParam(params.academicYear),
    term: firstParam(params.term),
    classId: firstParam(params.classId),
    subjectId: firstParam(params.subjectId),
  });

  return parsed.success ? parsed.data : {};
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "admin" && profile.role !== "headmaster") {
    redirect("/dashboard");
  }

  const filters = await resolveFilters(searchParams);
  const [overview, filterOptions, classPerformance, subjectPerformance, gradeDistribution, parentAccess, uploadActivity] = await Promise.all([
    getAnalyticsOverviewAction(filters),
    getAnalyticsFilterOptionsAction(filters),
    getClassPerformanceAction(filters),
    getSubjectPerformanceAction(filters),
    getGradeDistributionAction(filters),
    getParentAccessAnalyticsAction(filters),
    getUploadActivityAction(filters),
  ]);
  const hasPublishedResults = overview.publishedResults > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Academic insights for school leaders"
        description="Understand published results, class performance, subject trends, parent result access, and upload activity from one secure school-scoped view."
      />

      <AnalyticsFilters options={filterOptions} />
      <AnalyticsOverviewCards overview={overview} />

      {hasPublishedResults ? (
        <>
          <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <ClassPerformanceChart rows={classPerformance} />
            <GradeDistributionChart items={gradeDistribution} />
          </section>
          <SubjectPerformanceChart rows={subjectPerformance} />
        </>
      ) : (
        <AnalyticsEmptyState />
      )}

      <section className="grid gap-4 xl:grid-cols-2">
        <ParentAccessInsights data={parentAccess} />
        <UploadActivityPanel data={uploadActivity} />
      </section>
    </div>
  );
}
