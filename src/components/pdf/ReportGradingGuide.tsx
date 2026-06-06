import type { GradingBand } from "@/lib/settings/default-grading-scale";

export function ReportGradingGuide({ scale }: { scale: GradingBand[] }) {
  return (
    <section className="report-section report-compact">
      <h2>Grading Guide</h2>
      <div className="report-grade-grid">
        {scale.map((band) => (
          <div key={`${band.grade}-${band.min}-${band.max}`}>
            <strong>{band.grade}</strong>
            <span>{band.min}-{band.max}</span>
            <em>{band.remark}</em>
          </div>
        ))}
      </div>
    </section>
  );
}
