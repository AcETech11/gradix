import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { getUploadDetail } from "@/lib/uploads/data";

type UploadDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function UploadDetailPage({ params }: UploadDetailPageProps) {
  const { id } = await params;
  const detail = await getDetailOrNotFound(id);

  return (
    <div className="space-y-6">
      <PageHeader
        description={`${detail.className} · ${detail.upload.term} term · ${detail.upload.academic_year}`}
        eyebrow="Upload detail"
        title={detail.upload.source_filename ?? "Result upload"}
      />

      <section className="grid gap-3 sm:grid-cols-4">
        {[
          ["Status", detail.upload.status],
          ["Rows", `${detail.upload.valid_rows}/${detail.upload.total_rows}`],
          ["Invalid", String(detail.upload.invalid_rows)],
          ["Results Saved", String(detail.results.length)],
        ].map(([label, value]) => (
          <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4" key={label}>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-xl font-semibold capitalize text-slate-50">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
        <h2 className="text-lg font-semibold text-slate-50">Saved result rows</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[42rem] w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-slate-400">
              <tr className="border-b border-white/10">
                {["CA", "Exam", "Total", "Grade", "Remark", "Published"].map((header) => (
                  <th className="px-3 py-3 font-medium" key={header}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detail.results.map((result) => (
                <tr className="border-b border-white/5 text-slate-200" key={result.id}>
                  <td className="px-3 py-3">{result.continuous_assessment}</td>
                  <td className="px-3 py-3">{result.exam_score}</td>
                  <td className="px-3 py-3">{result.total_score}</td>
                  <td className="px-3 py-3">{result.grade}</td>
                  <td className="px-3 py-3">{result.remark ?? "-"}</td>
                  <td className="px-3 py-3">{result.is_published ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

async function getDetailOrNotFound(id: string) {
  try {
    return await getUploadDetail(id);
  } catch {
    notFound();
  }
}
