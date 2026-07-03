import { calculateReportSummary } from "@/lib/pdf/calculate-report-summary";
import type { PrintableReportData } from "@/lib/pdf/report-types";
import { formatPositionOutOf } from "@/lib/results/calculate-positions";
import { getScoreInkClassName } from "@/lib/results/score-ink";

export function ReportSummary({ report }: { report: PrintableReportData }) {
  const summary = calculateReportSummary(report.result.rows);
  const items = [
    ["Total Subjects", String(summary.subjectCount)],
    ["Total Score", summary.totalScore.toFixed(1)],
    ["Average Score", summary.averageScore.toFixed(1)],
    ["Overall Grade", summary.overallGrade],
    ["Overall Position", formatPositionOutOf(report.result.overallPosition, report.result.classStudentCount)],
    ["Highest Subject", summary.highestSubject ? `${summary.highestSubject.subject} (${summary.highestSubject.total})` : "N/A"],
    ["Lowest Subject", summary.lowestSubject ? `${summary.lowestSubject.subject} (${summary.lowestSubject.total})` : "N/A"],
    ["Performance Remark", summary.performanceRemark],
  ];

  return (
    <section className="report-section">
      <h2>Performance Summary</h2>
      <div className="report-summary-grid">
        {items.map(([label, value]) => {
          const valueClassName = label === "Average Score" || label === "Overall Grade" ? getScoreInkClassName(summary.averageScore) : undefined;

          return (
          <div className="report-summary-item" key={label}>
            <span>{label}</span>
            <strong className={valueClassName}>{value}</strong>
          </div>
        );
        })}
      </div>
    </section>
  );
}
