export const metadata = {
  title: "Gradix Admin User Guide",
};

const sections = [
  ["Dashboard overview", "Use the dashboard to see setup progress, recent activity, and quick signals for students, uploads, and parent checks."],
  ["Student management", "Add students with parent details and permanent codes. Keep graduated, transferred, withdrawn, and archived students in the database for historical records."],
  ["Excel template workflow", "Download a class template, send it to teachers externally, and ask them to fill only CA, Exam, and Remark columns."],
  ["Result upload", "Upload the completed workbook, fix validation issues, preview rows, and save only clean results."],
  ["Publishing results", "Review results before publishing. Admins can edit scores; admins and headmasters can publish."],
  ["Parent result checker", "Parents use the permanent student code on the public result checker. Only published results appear."],
  ["Parent access reset", "Use Parent Access to monitor views, reset counts, or increase limits without changing the student code."],
  ["Report card printing", "Open the published result and print/download the official report. Disable browser headers and footers for best PDF output."],
  ["Settings and branding", "Update school profile, logo, seal, principal signature, report settings, grading scale, and teacher signatures."],
  ["Class promotion", "After third term, promote students into the next academic year. Historical results keep their original class, term, and year."],
  ["Troubleshooting", "Check audit logs for important actions, confirm classes have subjects before templates, and verify students are active before upload."],
];

export default function PrintableHelpPage() {
  return (
    <main className="min-h-dvh bg-white px-6 py-8 text-slate-950 print:px-0 print:py-0">
      <article className="mx-auto max-w-4xl rounded-xl border border-slate-200 p-8 shadow-sm print:border-0 print:p-0 print:shadow-none">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">Gradix Guide</p>
          <h1 className="mt-2 text-3xl font-bold">Gradix Admin User Guide</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">A printable guide for school admins and headmasters using Gradix for result management.</p>
        </header>
        <div className="mt-6 grid gap-4">
          {sections.map(([title, body], index) => (
            <section className="break-inside-avoid rounded-lg border border-slate-200 p-4" key={title}>
              <h2 className="text-base font-semibold">{index + 1}. {title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">{body}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
