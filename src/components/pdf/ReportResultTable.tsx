import type { ParentResultRow } from "@/lib/parent-portal/parent-result-types";
import { reportGradeFromScore, reportGradeMeaning } from "@/lib/pdf/grade-scale";
import { calculateReportSummary } from "@/lib/pdf/calculate-report-summary";
import { formatPosition, formatPositionOutOf } from "@/lib/results/calculate-positions";
import { getScoreInkClassName } from "@/lib/results/score-ink";

export function ReportResultTable({
  rows,
  overallPosition,
  classStudentCount,
  title = "COGNITIVE DOMAIN",
  showAverageLine = false,
}: {
  rows: ParentResultRow[];
  overallPosition?: number | null;
  classStudentCount?: number | null;
  title?: string;
  showAverageLine?: boolean;
}) {
  const summary = calculateReportSummary(rows);

  return (
    <section className="report-section">
      <h2>{title}</h2>
      <table className="report-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>CA / 40</th>
            <th>Exam / 60</th>
            <th>Total / 100</th>
            <th>Grade</th>
            <th>Remark</th>
            <th>Position</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const grade = reportGradeFromScore(row.total);
            const inkClassName = getScoreInkClassName(row.total);

            return (
              <tr key={row.subject}>
                <td className="report-subject-cell">{row.subject}</td>
                <td>{row.ca}</td>
                <td>{row.exam}</td>
                <td className={inkClassName}>
                  <strong>{row.total}</strong>
                </td>
                <td className={inkClassName}>
                  <span className="report-grade-badge">{grade}</span>
                  <span className="report-performance-label">{reportGradeMeaning(grade)}</span>
                </td>
                <td className="report-remark-cell">{row.remark ?? reportGradeMeaning(grade)}</td>
                <td>{formatPosition(row.position)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {showAverageLine ? (
        <div className="report-cognitive-summary">
          <strong className={getScoreInkClassName(summary.averageScore)}>Average: {summary.averageScore.toFixed(1)}%</strong>
          <span>Overall Position: {formatPositionOutOf(overallPosition, classStudentCount)}</span>
        </div>
      ) : null}
    </section>
  );
}
