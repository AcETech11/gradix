import type { ParentResultRow } from "@/lib/parent-portal/parent-result-types";

export function ParentResultTable({ rows }: { rows: ParentResultRow[] }) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.25)] sm:p-6">
      <h2 className="text-xl font-semibold text-slate-950">Subject Results</h2>
      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr className="border-b border-slate-100">
              {["Subject", "CA", "Exam", "Total", "Grade", "Remark", "Position"].map((header) => (
                <th className="px-3 py-3 font-semibold" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-slate-100 last:border-0" key={row.subject}>
                <td className="px-3 py-4 font-medium text-slate-950">{row.subject}</td>
                <td className="px-3 py-4">{row.ca}</td>
                <td className="px-3 py-4">{row.exam}</td>
                <td className="px-3 py-4 font-semibold">{row.total}</td>
                <td className="px-3 py-4">{row.grade}</td>
                <td className="px-3 py-4">{row.remark ?? "-"}</td>
                <td className="px-3 py-4">{row.position ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {rows.map((row) => (
          <article className="rounded-2xl border border-slate-100 bg-slate-50 p-4" key={row.subject}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-950">{row.subject}</p>
                <p className="mt-1 text-sm text-slate-500">{row.remark ?? "No remark"}</p>
              </div>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">{row.grade}</span>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-sm">
              <Score label="CA" value={row.ca} />
              <Score label="Exam" value={row.exam} />
              <Score label="Total" value={row.total} />
              <Score label="Position" value={row.position ?? "-"} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Score({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white p-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-950">{value}</p>
    </div>
  );
}
