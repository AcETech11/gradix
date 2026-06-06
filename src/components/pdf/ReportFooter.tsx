import type { PrintableReportData } from "@/lib/pdf/report-types";

export function ReportFooter({ report }: { report: PrintableReportData }) {
  return (
    <footer className="report-footer">
      <strong>Generated securely by Gradix</strong>
      <span>{report.reportSettings.footerNote}</span>
    </footer>
  );
}
