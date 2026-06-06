import type { PrintableReportData } from "@/lib/pdf/report-types";

export function ReportStudentInfo({ report }: { report: PrintableReportData }) {
  const items = [
    ["Student Name", report.student.name],
    ...(report.reportSettings.showStudentCode ? [["Student Code", report.student.code]] : []),
    ...(report.reportSettings.showAdmissionNumber ? [["Admission Number", report.student.admissionNumber ?? "N/A"]] : []),
    ["Class", report.result.className],
    ["Term", `${report.result.term} term`],
    ["Academic Year", report.result.academicYear],
    ["Result Status", "Verified / Published"],
    ["Published Date", report.result.publishedAt ? new Date(report.result.publishedAt).toLocaleDateString() : "Published"],
  ];

  return (
    <section className="report-section">
      <h2>Student Information</h2>
      <div className="report-info-grid">
        {items.map(([label, value]) => (
          <div className="report-info-item" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
