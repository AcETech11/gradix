import type { PrintableReportData } from "@/lib/pdf/report-types";

/* eslint-disable @next/next/no-img-element */

export function ReportHeader({ report }: { report: PrintableReportData }) {
  return (
    <header className="report-header">
      <div className="report-header-main">
        <div className="report-logo-frame">
          <div className="report-logo">
            {report.school.logoUrl ? (
              <img alt={`${report.school.name} logo`} crossOrigin="anonymous" src={report.school.logoUrl} />
            ) : (
              <span>School Crest</span>
            )}
          </div>
          {!report.school.logoUrl ? <span>School Crest</span> : null}
        </div>
        <div className="report-school">
          <h1>{report.school.name}</h1>
          {report.reportSettings.showSchoolMotto && report.school.motto ? <p className="report-motto">{report.school.motto}</p> : null}
          {report.school.address ? <p>{report.school.address}</p> : null}
          <p>{[report.school.phone, report.school.email].filter(Boolean).join(" | ")}</p>
        </div>
      </div>
      <div className="report-title-bar">
        <strong>{report.reportSettings.reportTitle}</strong>
        <span>{report.reportSettings.footerNote}</span>
      </div>
    </header>
  );
}
