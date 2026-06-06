import type { ParentResultRow } from "@/lib/parent-portal/parent-result-types";
import { reportGradeFromScore, reportGradeMeaning } from "@/lib/pdf/grade-scale";
import { getPerformanceBand } from "@/lib/results/performance-scale";

export function ReportResultTable({ rows }: { rows: ParentResultRow[] }) {
  return (
    <section className="report-section">
      <h2>Academic Result</h2>
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
            const performance = getPerformanceBand(row.total);

            return (
              <tr key={row.subject}>
                <td className="report-subject-cell">{row.subject}</td>
                <td>{row.ca}</td>
                <td>{row.exam}</td>
                <td className={performance.printClassName}>
                  <strong>{row.total}</strong>
                </td>
                <td className={performance.printClassName}>
                  <span className="report-grade-badge">{grade}</span>
                  <span className="report-performance-label">{reportGradeMeaning(grade)}</span>
                </td>
                <td className="report-remark-cell">{row.remark ?? reportGradeMeaning(grade)}</td>
                <td>{row.position ?? "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
