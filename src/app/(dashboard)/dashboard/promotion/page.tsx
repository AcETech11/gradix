import { getPromotionOverviewAction } from "@/actions/promotion/get-promotion-overview-action";
import { PageHeader } from "@/components/dashboard/page-header";
import { PromotionEmptyState } from "@/components/promotion/PromotionEmptyState";
import { PromotionFilters } from "@/components/promotion/PromotionFilters";
import { PromotionOverviewCards } from "@/components/promotion/PromotionOverviewCards";
import { RecentPromotionActivity } from "@/components/promotion/RecentPromotionActivity";
import { StudentPromotionTable } from "@/components/promotion/StudentPromotionTable";
import type { PromotionPageData } from "@/lib/promotion/promotion-types";

type PromotionPageProps = {
  searchParams: Promise<Partial<PromotionPageData["selected"]>>;
};

export default async function PromotionPage({ searchParams }: PromotionPageProps) {
  const params = await searchParams;
  const data = await getPromotionOverviewAction(params);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academic Year"
        title="Promotion and rollover"
        description="Promote students, graduate final-year learners, and preserve historical result records across academic years."
      />
      <PromotionOverviewCards overview={data.overview} />
      {data.classes.length === 0 ? (
        <PromotionEmptyState />
      ) : (
        <>
          <PromotionFilters classes={data.classes} selected={data.selected} />
          <div className="grid gap-6 2xl:grid-cols-[1fr_24rem]">
            <StudentPromotionTable classes={data.classes} selected={data.selected} students={data.students} />
            <RecentPromotionActivity activity={data.recentActivity} />
          </div>
        </>
      )}
    </div>
  );
}
