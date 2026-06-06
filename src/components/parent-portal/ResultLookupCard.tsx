import { AccessCounter } from "@/components/parent-portal/AccessCounter";
import { ParentResultTable } from "@/components/parent-portal/ParentResultTable";
import { ResultSummaryCards } from "@/components/parent-portal/ResultSummaryCards";
import { ResultVerificationBanner } from "@/components/parent-portal/ResultVerificationBanner";
import { StudentResultHeader } from "@/components/parent-portal/StudentResultHeader";
import { TermSelector } from "@/components/parent-portal/TermSelector";
import { PrintActions } from "@/components/pdf/PrintActions";
import { PrintableReportCard } from "@/components/pdf/PrintableReportCard";
import type { PublicResultPayload } from "@/lib/parent-portal/parent-result-types";

type ResultLookupCardProps = {
  code: string;
  result: PublicResultPayload;
};

export function ResultLookupCard({ code, result }: ResultLookupCardProps) {
  return (
    <div className="w-full space-y-5 py-6">
      <div className="print-hidden">
        <PrintActions />
      </div>
      <div className="web-result-content space-y-5">
        <StudentResultHeader result={result} />
        <ResultVerificationBanner />
        <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
          <TermSelector code={code} currentAcademicYear={result.result.academicYear} currentTerm={result.result.term} options={result.termOptions} />
          <AccessCounter maxUses={result.access.maxUses} remaining={result.access.remaining} useCount={result.access.useCount} />
        </div>
        <ResultSummaryCards rows={result.result.rows} />
        <ParentResultTable rows={result.result.rows} />
      </div>
      <PrintableReportCard result={result} />
    </div>
  );
}
