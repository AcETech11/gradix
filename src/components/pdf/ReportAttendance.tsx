import type { PrintableReportData } from "@/lib/pdf/report-types";

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

export function ReportAttendance({ report }: { report: PrintableReportData }) {
  const label = report.reportSettings.attendanceOpenDaysLabel || "No. of Days School Opened";
  const items = [
    [label, report.comprehensive.schoolOpenDays ?? "-"],
    ["No. of Days Present", report.comprehensive.attendancePresent ?? "-"],
    ["No. of Days Absent", report.comprehensive.attendanceAbsent ?? "-"],
    ["Term Ends", formatDate(report.comprehensive.termEndsOn)],
    ["Next Term Begins", formatDate(report.comprehensive.nextTermBeginsOn)],
  ];

  return (
    <section className="report-section report-compact-section">
      <h2>ATTENDANCE RECORD</h2>
      <div className="report-attendance-grid">
        {items.map(([labelText, value]) => (
          <div className="report-attendance-item" key={labelText}>
            <span>{labelText}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
