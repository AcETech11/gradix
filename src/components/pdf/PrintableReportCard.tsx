import { ReportFooter } from "@/components/pdf/ReportFooter";
import { ReportAttendance } from "@/components/pdf/ReportAttendance";
import { ReportDevelopmentDomains } from "@/components/pdf/ReportDevelopmentDomains";
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
      <ReportAttendance report={report} />
      <ReportResultTable
        classStudentCount={report.result.classStudentCount}
        overallPosition={report.result.overallPosition}
        rows={report.result.rows}
        showAverageLine
        title="COGNITIVE DOMAIN"
      />
      <ReportSummary report={report} />
      <ReportDevelopmentDomains forceShow report={report} />
      <ReportGradingGuide scale={report.gradingScale} />
      <ReportSignatureBlock report={report} />
      <ReportFooter report={report} />
    </article>
  );
}
