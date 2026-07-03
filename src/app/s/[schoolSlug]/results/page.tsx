import { notFound } from "next/navigation";

import { ParentPortalLayout } from "@/components/parent-portal/ParentPortalLayout";
import { ResultCodeForm } from "@/components/parent-portal/ResultCodeForm";
import { getPublicSchoolPortal } from "@/lib/parent-portal/school-portal";

type SchoolResultsPageProps = {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ error?: string }>;
};

export async function generateMetadata({ params }: SchoolResultsPageProps) {
  const { schoolSlug } = await params;
  const school = await getPublicSchoolPortal(schoolSlug);

  return {
    title: school ? `${school.name} Result Verification` : "Result Verification",
  };
}

export default async function SchoolResultsPage({ params, searchParams }: SchoolResultsPageProps) {
  const [{ schoolSlug }, query] = await Promise.all([params, searchParams]);
  const school = await getPublicSchoolPortal(schoolSlug);

  if (!school) notFound();

  const errorMessage =
    query.error === "invalid"
      ? "This result code is not valid. Please check the code and try again."
      : undefined;

  return (
    <ParentPortalLayout school={school}>
      <ResultCodeForm errorMessage={errorMessage} routeScope="path" school={school} />
    </ParentPortalLayout>
  );
}
