import Image from "next/image";

import type { PrintableReportData } from "@/lib/pdf/report-types";

export function ReportSignatureBlock({ report }: { report: PrintableReportData }) {
  return (
    <section className="report-signatures">
      <div className="report-comment-grid">
        <div className="report-comment">
          <span>Class Teacher Comment</span>
          <p>{report.reportSettings.classTeacherComment}</p>
        </div>
        <div className="report-comment">
          <span>Principal Comment</span>
          <p>{report.reportSettings.principalComment}</p>
        </div>
      </div>
      <div className="report-signature-grid">
        <div className="report-signature-box">
          <div className="report-signature-placeholder" />
          <strong>Class Teacher</strong>
          <span>Signature</span>
        </div>
        <div className="report-signature-box">
          {report.principalSignatureUrl ? (
            <Image alt="Principal signature" className="report-signature-image" height={52} src={report.principalSignatureUrl} unoptimized width={140} />
          ) : (
            <div className="report-signature-placeholder" />
          )}
          <strong>{report.principalName}</strong>
          <span>Principal Signature</span>
        </div>
        <div className="report-signature-box">
          <strong>{new Date(report.printedAt).toLocaleDateString()}</strong>
          <span>Date Printed</span>
        </div>
        <div className="report-stamp-box">
          <strong>{report.reportSettings.nextTermBegins ? `Next Term: ${new Date(report.reportSettings.nextTermBegins).toLocaleDateString()}` : "School Stamp / Seal"}</strong>
          <span>Official validation area</span>
        </div>
      </div>
    </section>
  );
}
