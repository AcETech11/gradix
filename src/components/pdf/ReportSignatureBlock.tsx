import type { PrintableReportData } from "@/lib/pdf/report-types";

/* eslint-disable @next/next/no-img-element */

export function ReportSignatureBlock({ report }: { report: PrintableReportData }) {
  return (
    <section className="report-signatures">
      <div className="report-comment">
        <span>Class Teacher Comment</span>
        <p>{report.classTeacherComment || "\u00a0"}</p>
      </div>
      <div className="report-signature-grid">
        <div className="report-signature-box">
          {report.classTeacherSignatureUrl ? (
            <img alt="Class teacher signature" className="report-signature-image" crossOrigin="anonymous" src={report.classTeacherSignatureUrl} />
          ) : (
            <div className="report-signature-placeholder" />
          )}
          <strong>{report.classTeacherName}</strong>
          <span>Class Teacher</span>
        </div>
        <div className="report-signature-box">
          {report.principalSignatureUrl ? (
            <img alt="Principal signature" className="report-signature-image" crossOrigin="anonymous" src={report.principalSignatureUrl} />
          ) : (
            <div className="report-signature-placeholder" />
          )}
          <strong>{report.principalName || "Principal / Head Teacher"}</strong>
          <span>Principal / Head Teacher</span>
        </div>
        <div className="report-signature-box">
          <strong>{new Date(report.printedAt).toLocaleDateString()}</strong>
          <span>Date Printed</span>
        </div>
        <div className="report-stamp-box">
          {report.school.sealUrl ? (
            <img alt="School seal" className="report-stamp-image" crossOrigin="anonymous" src={report.school.sealUrl} />
          ) : (
            <>
              <strong>School Stamp / Seal</strong>
              <span>Official validation area</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
