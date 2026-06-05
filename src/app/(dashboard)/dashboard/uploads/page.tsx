import { FileSpreadsheet, PlusCircle, UploadCloud } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { getUploadHistory } from "@/lib/uploads/data";

export default async function UploadsPage() {
  const uploads = await getUploadHistory();

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild className="bg-orange-600 text-white hover:bg-orange-700">
            <Link href="/dashboard/uploads/new">
              <PlusCircle />
              New upload
            </Link>
          </Button>
        }
        description="Validate completed Excel templates, review normalized result rows, and save clean uploads as draft or validated."
        eyebrow="Uploads"
        title="Result upload engine"
      />

      {uploads.length === 0 ? (
        <EmptyState
          action={
            <Button asChild className="bg-orange-600 text-white hover:bg-orange-700">
              <Link href="/dashboard/uploads/new">
                <UploadCloud />
                Start upload
              </Link>
            </Button>
          }
          description="Upload a completed Gradix Excel result template to begin validation."
          icon={FileSpreadsheet}
          title="No uploads yet"
        />
      ) : (
        <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <div className="overflow-x-auto">
            <table className="min-w-[52rem] w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-slate-400">
                <tr className="border-b border-white/10">
                  {["File", "Class", "Term", "Status", "Rows", "Created", ""].map((header) => (
                    <th className="px-3 py-3 font-medium" key={header}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uploads.map((upload) => (
                  <tr className="border-b border-white/5 text-slate-200" key={upload.id}>
                    <td className="px-3 py-3">{upload.source_filename ?? "Untitled upload"}</td>
                    <td className="px-3 py-3">{upload.className}</td>
                    <td className="px-3 py-3 capitalize">
                      {upload.term} term, {upload.academic_year}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full border border-orange-300/20 bg-orange-500/10 px-2.5 py-1 text-xs font-medium capitalize text-orange-100">
                        {upload.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {upload.valid_rows}/{upload.total_rows}
                    </td>
                    <td className="px-3 py-3">{new Date(upload.created_at).toLocaleDateString()}</td>
                    <td className="px-3 py-3 text-right">
                      <Link className="text-orange-200 hover:text-orange-100" href={`/dashboard/uploads/${upload.id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
