import { ParentPortalLayout } from "@/components/parent-portal/ParentPortalLayout";
import { ResultCodeForm } from "@/components/parent-portal/ResultCodeForm";

type ResultsLandingPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ResultsLandingPage({ searchParams }: ResultsLandingPageProps) {
  const params = await searchParams;
  const errorMessage =
    params.error === "invalid"
      ? "This result code is not valid. Please check the code and try again."
      : undefined;

  return (
    <ParentPortalLayout>
      <ResultCodeForm errorMessage={errorMessage} />
    </ParentPortalLayout>
  );
}
