"use client";

import { useMemo, useState, useTransition } from "react";
import { Archive, Eye, FileCheck2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { archiveUploadAction } from "@/actions/results/archive-upload-action";
import { Button } from "@/components/ui/button";
import { PublishConfirmationDialog } from "@/components/results/PublishConfirmationDialog";
import { ResultExportButtons } from "@/components/results/ResultExportButtons";
import { ResultFilters } from "@/components/results/ResultFilters";
import { ResultStatusBadge } from "@/components/results/ResultStatusBadge";
import { UnpublishConfirmationDialog } from "@/components/results/UnpublishConfirmationDialog";
import type { ResultUploadListItem } from "@/lib/results/result-types";
import type { UploadStatus } from "@/types/database";

type ResultUploadsTableProps = {
  uploads: ResultUploadListItem[];
};

export function ResultUploadsTable({ uploads }: ResultUploadsTableProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | UploadStatus>("all");
  const [isPending, startTransition] = useTransition();
  const filteredUploads = useMemo(
    () =>
      uploads.filter((upload) => {
        const matchesSearch = [upload.className, upload.term, upload.academicYear, upload.uploadedBy, upload.sourceFilename]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesStatus = status === "all" || upload.status === status;

        return matchesSearch && matchesStatus;
      }),
    [search, status, uploads],
  );

  function archive(uploadId: string) {
    if (!window.confirm("Archiving hides this upload by default but never deletes result data.")) {
      return;
    }

    startTransition(async () => {
      const response = await archiveUploadAction(uploadId);
      setMessage(response.message);

      if (response.ok) {
        router.refresh();
      }
    });
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Result uploads</h2>
          <p className="text-sm text-slate-400">Review, publish, unpublish, and archive official result batches.</p>
        </div>
        <ResultFilters onSearchChange={setSearch} onStatusChange={setStatus} search={search} status={status} />
      </div>

      {message ? <div className="mt-4 rounded-xl border border-orange-300/20 bg-orange-500/10 px-4 py-3 text-sm text-orange-100">{message}</div> : null}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[76rem] w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-slate-400">
            <tr className="border-b border-white/10">
              {["Class", "Term", "Status", "Students", "Rows", "Uploaded By", "Uploaded", "Published", "Actions"].map((header) => (
                <th className="px-3 py-3 font-medium" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredUploads.map((upload) => (
              <tr className="border-b border-white/5 text-slate-200" key={upload.id}>
                <td className="px-3 py-3">
                  <p className="font-medium text-slate-50">{upload.className}</p>
                  <p className="text-xs text-slate-400">{upload.sourceFilename}</p>
                </td>
                <td className="px-3 py-3 capitalize">
                  {upload.term} term, {upload.academicYear}
                </td>
                <td className="px-3 py-3">
                  <ResultStatusBadge status={upload.status} />
                </td>
                <td className="px-3 py-3">{upload.totalStudents}</td>
                <td className="px-3 py-3">{upload.totalRows}</td>
                <td className="px-3 py-3">{upload.uploadedBy}</td>
                <td className="px-3 py-3">{new Date(upload.uploadedDate).toLocaleDateString()}</td>
                <td className="px-3 py-3">{upload.publishedDate ? new Date(upload.publishedDate).toLocaleDateString() : "Not published"}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/results/${upload.id}`}>
                        <Eye />
                        View
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/results/${upload.id}/review`}>
                        <FileCheck2 />
                        Review
                      </Link>
                    </Button>
                    <ResultExportButtons uploadId={upload.id} />
                    {upload.canPublish ? <PublishConfirmationDialog disabled={isPending} onMessage={setMessage} uploadId={upload.id} /> : null}
                    {upload.canUnpublish ? <UnpublishConfirmationDialog disabled={isPending} onMessage={setMessage} uploadId={upload.id} /> : null}
                    {upload.canArchive ? (
                      <Button disabled={isPending} onClick={() => archive(upload.id)} size="sm" type="button" variant="outline">
                        <Archive />
                        Archive
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
