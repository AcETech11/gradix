const instructions = [
  "Do not change column headers.",
  "CA score must be between 0 and 40.",
  "Exam score must be between 0 and 60.",
  "Do not delete Student ID.",
  "Fill only score and remark columns.",
  "Save as .xlsx before uploading.",
  "One row equals one student.",
];

export function TemplateInstructions() {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300/80">Workbook Rules</p>
      <h2 className="mt-2 text-xl font-semibold text-slate-50">Template instructions</h2>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
        {instructions.map((instruction) => (
          <li className="flex gap-3" key={instruction}>
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange-300" />
            <span>{instruction}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
