import { AFFECTIVE_TRAITS, PSYCHOMOTOR_TRAITS, RATING_SCALE } from "@/lib/reports/primary-report";
import type { PrintableReportData } from "@/lib/pdf/report-types";

export function ReportDevelopmentDomains({ report, forceShow = false }: { report: PrintableReportData; forceShow?: boolean }) {
  return (
    <>
      <section className="report-development-grid">
        {forceShow || report.reportSettings.showAffectiveDomain ? (
          <DomainTable title="AFFECTIVE DOMAIN" subtitle="Work Habits & Social Skills" traits={AFFECTIVE_TRAITS} ratings={report.comprehensive.affectiveDomain} />
        ) : null}
        {forceShow || report.reportSettings.showPsychomotorDomain ? (
          <DomainTable title="PSYCHOMOTOR DOMAIN" traits={PSYCHOMOTOR_TRAITS} ratings={report.comprehensive.psychomotorDomain} />
        ) : null}
      </section>
      {forceShow || report.reportSettings.showRatingScale ? (
        <section className="report-section report-compact-section">
          <h2>SCALE</h2>
          <div className="report-scale-grid">
            {RATING_SCALE.map(([rating, description]) => (
              <div key={rating}>
                <span>
                  <strong>{rating}</strong> - {description}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function DomainTable({
  title,
  subtitle,
  traits,
  ratings,
}: {
  title: string;
  subtitle?: string;
  traits: readonly string[];
  ratings: Record<string, number | undefined>;
}) {
  return (
    <section className="report-section report-compact-section">
      <h2>{title}</h2>
      {subtitle ? <p className="report-section-subtitle">{subtitle}</p> : null}
      <table className="report-table report-domain-table">
        <thead>
          <tr>
            <th>Trait</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {traits.map((trait) => (
            <tr key={trait}>
              <td>{trait}</td>
              <td>{ratings[trait] ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
