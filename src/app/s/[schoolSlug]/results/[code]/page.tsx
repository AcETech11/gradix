import { notFound } from "next/navigation";

import { getPublicResultAction } from "@/actions/parent-portal/get-public-result-action";
import { ParentPortalEmptyState } from "@/components/parent-portal/ParentPortalEmptyState";
import { ParentPortalLayout } from "@/components/parent-portal/ParentPortalLayout";
import { ResultLookupCard } from "@/components/parent-portal/ResultLookupCard";
import { normalizeResultCode } from "@/lib/parent-portal/normalize-result-code";
import { getPublicSchoolPortal } from "@/lib/parent-portal/school-portal";

export const metadata = {
  title: "Official Student Result Report",
};

type SchoolPublicResultPageProps = {
  params: Promise<{ schoolSlug: string; code: string }>;
  searchParams: Promise<{ term?: string; year?: string }>;
};

export default async function SchoolPublicResultPage({ params, searchParams }: SchoolPublicResultPageProps) {
  const [{ schoolSlug, code }, query] = await Promise.all([params, searchParams]);
  const school = await getPublicSchoolPortal(schoolSlug);

  if (!school) notFound();

  const normalizedCode = normalizeResultCode(decodeURIComponent(code));
  const result = await getPublicResultAction({
    code: normalizedCode,
    term: query.term,
    academicYear: query.year,
    schoolSlug: school.slug,
  });

  return (
    <ParentPortalLayout school={school}>
      {result.ok ? (
        <ResultLookupCard code={normalizedCode} result={result} schoolSlug={school.slug} />
      ) : (
        <ParentPortalEmptyState description="No result found." href={`/s/${encodeURIComponent(school.slug)}/results`} title="Result unavailable" />
      )}
    </ParentPortalLayout>
  );
}
