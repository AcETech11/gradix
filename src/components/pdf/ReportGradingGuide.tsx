export function ReportGradingGuide() {
  const guide = [
    ["70-100", "A", "Excellent"],
    ["60-69", "B", "Good"],
    ["50-59", "C", "Credit"],
    ["40-49", "D", "Pass"],
    ["0-39", "F", "Fail"],
  ];

  return (
    <section className="report-section report-compact">
      <h2>Grading Guide</h2>
      <div className="report-grade-grid">
        {guide.map(([range, grade, meaning]) => (
          <div key={grade}>
            <strong>{grade}</strong>
            <span>{range}</span>
            <em>{meaning}</em>
          </div>
        ))}
      </div>
    </section>
  );
}
