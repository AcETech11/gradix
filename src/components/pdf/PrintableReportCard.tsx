import { ReportFooter } from "@/components/pdf/ReportFooter";
import { ReportGradingGuide } from "@/components/pdf/ReportGradingGuide";
import { ReportHeader } from "@/components/pdf/ReportHeader";
import { ReportResultTable } from "@/components/pdf/ReportResultTable";
import { ReportSignatureBlock } from "@/components/pdf/ReportSignatureBlock";
import { ReportStudentInfo } from "@/components/pdf/ReportStudentInfo";
import { ReportSummary } from "@/components/pdf/ReportSummary";
import { formatReportData } from "@/lib/pdf/format-report-data";
import type { PublicResultPayload } from "@/lib/parent-portal/parent-result-types";

export function PrintableReportCard({ result }: { result: PublicResultPayload }) {
  const report = formatReportData(result);

  return (
    <article className="report-card print-report">
      <ReportHeader report={report} />
      <ReportStudentInfo report={report} />
      <ReportResultTable rows={report.result.rows} />
      <ReportSummary report={report} />
      <ReportGradingGuide />
      <ReportSignatureBlock report={report} />
      <ReportFooter />
    </article>
  );
}
