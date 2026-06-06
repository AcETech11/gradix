import { getPublicResultAction } from "@/actions/parent-portal/get-public-result-action";
import { ParentPortalEmptyState } from "@/components/parent-portal/ParentPortalEmptyState";
import { ParentPortalLayout } from "@/components/parent-portal/ParentPortalLayout";
import { ResultLookupCard } from "@/components/parent-portal/ResultLookupCard";
import { normalizeResultCode } from "@/lib/parent-portal/normalize-result-code";

type PublicResultPageProps = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ term?: string; year?: string }>;
};

export default async function PublicResultPage({ params, searchParams }: PublicResultPageProps) {
  const [{ code }, query] = await Promise.all([params, searchParams]);
  const normalizedCode = normalizeResultCode(decodeURIComponent(code));
  const result = await getPublicResultAction({
    code: normalizedCode,
    term: query.term,
    academicYear: query.year,
  });

  return (
    <ParentPortalLayout>
      {result.ok ? (
        <ResultLookupCard code={normalizedCode} result={result} />
      ) : (
        <ParentPortalEmptyState description={result.message} title="Result unavailable" />
      )}
    </ParentPortalLayout>
  );
}
