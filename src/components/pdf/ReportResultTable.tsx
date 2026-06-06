import type { ParentResultRow } from "@/lib/parent-portal/parent-result-types";
import { reportGradeFromScore, reportGradeMeaning } from "@/lib/pdf/grade-scale";

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
          {rows.map((row) => (
            <tr key={row.subject}>
              <td className="report-subject-cell">{row.subject}</td>
              <td>{row.ca}</td>
              <td>{row.exam}</td>
              <td>{row.total}</td>
              <td>
                <span className="report-grade-badge">{reportGradeFromScore(row.total)}</span>
              </td>
              <td className="report-remark-cell">{row.remark ?? reportGradeMeaning(reportGradeFromScore(row.total))}</td>
              <td>{row.position ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
