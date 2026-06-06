import { getParentAccessRecordsAction } from "@/actions/parent-access/get-parent-access-records-action";
import { PageHeader } from "@/components/dashboard/page-header";
import { ParentAccessEmptyState } from "@/components/parent-access/ParentAccessEmptyState";
import { ParentAccessExportButton } from "@/components/parent-access/ParentAccessExportButton";
import { ParentAccessFilters } from "@/components/parent-access/ParentAccessFilters";
import { ParentAccessOverviewCards } from "@/components/parent-access/ParentAccessOverviewCards";
import { ParentAccessTable } from "@/components/parent-access/ParentAccessTable";
import { RecentParentAccessActivity } from "@/components/parent-access/RecentParentAccessActivity";
import type { ParentAccessFilters as ParentAccessFilterValues } from "@/lib/parent-access/parent-access-types";

type ParentAccessPageProps = {
  searchParams: Promise<ParentAccessFilterValues>;
};

export default async function ParentAccessPage({ searchParams }: ParentAccessPageProps) {
  const filters = await searchParams;
  const data = await getParentAccessRecordsAction(filters);
  const canManage = data.profile.role === "admin";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Parent Access"
        title="Parent access monitoring"
        description="Track result code usage, students checked by parents, view limits, and access activity for this school."
        actions={<ParentAccessExportButton filters={data.filters} />}
      />

      {!data.hasPublishedResults ? (
        <ParentAccessEmptyState type="no_published_results" />
      ) : (
        <>
          <ParentAccessOverviewCards overview={data.overview} />
          <ParentAccessFilters
            academicYears={data.academicYears}
            classOptions={data.classOptions}
            termOptions={data.termOptions}
            values={data.filters}
          />
          {data.records.length === 0 ? (
            <ParentAccessEmptyState type="no_parent_checks" />
          ) : (
            <div className="grid gap-6 2xl:grid-cols-[1fr_24rem]">
              <ParentAccessTable canManage={canManage} records={data.records} />
              <RecentParentAccessActivity activity={data.recentActivity} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
