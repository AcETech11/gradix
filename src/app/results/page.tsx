import { ParentPortalLayout } from "@/components/parent-portal/ParentPortalLayout";
import { ResultCodeForm } from "@/components/parent-portal/ResultCodeForm";
import { getPublicSchoolPortal, getSchoolSlugFromHostname } from "@/lib/parent-portal/school-portal";

type ResultsLandingPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ResultsLandingPage({ searchParams }: ResultsLandingPageProps) {
  const params = await searchParams;
  const hostSchoolSlug = await getSchoolSlugFromHostname();
  const school = hostSchoolSlug ? await getPublicSchoolPortal(hostSchoolSlug) : null;
  const errorMessage =
    params.error === "invalid"
      ? "This result code is not valid. Please check the code and try again."
      : undefined;

  return (
    <ParentPortalLayout school={school}>
      <ResultCodeForm errorMessage={errorMessage} routeScope={school ? "host" : "generic"} school={school} />
    </ParentPortalLayout>
  );
}
