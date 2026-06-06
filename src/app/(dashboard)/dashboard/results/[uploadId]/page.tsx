import { FileCheck2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { getUploadResultsAction } from "@/actions/results/get-upload-results-action";
import { PageHeader } from "@/components/dashboard/page-header";
import { PublishConfirmationDialog } from "@/components/results/PublishConfirmationDialog";
import { ResultStatusBadge } from "@/components/results/ResultStatusBadge";
import { UnpublishConfirmationDialog } from "@/components/results/UnpublishConfirmationDialog";
import { Button } from "@/components/ui/button";

type ResultUploadPageProps = {
  params: Promise<{ uploadId: string }>;
};

export default async function ResultUploadPage({ params }: ResultUploadPageProps) {
  const { uploadId } = await params;
  const { upload, rows } = await getDetailOrNotFound(uploadId);
  const publishedRows = rows.filter((row) => row.isPublished).length;
  const editedRows = rows.filter((row) => row.editCount > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/dashboard/results/${upload.id}/review`}>
                <FileCheck2 />
                Review rows
              </Link>
            </Button>
            {upload.canPublish ? <PublishConfirmationDialog uploadId={upload.id} /> : null}
            {upload.canUnpublish ? <UnpublishConfirmationDialog uploadId={upload.id} /> : null}
          </>
        }
        description={`${upload.className} · ${upload.term} term · ${upload.academicYear}`}
        eyebrow="Result Upload"
        title={upload.sourceFilename}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Status" value={<ResultStatusBadge status={upload.status} />} />
        <SummaryCard label="Rows" value={`${upload.validRows}/${upload.totalRows}`} />
        <SummaryCard label="Published rows" value={String(publishedRows)} />
        <SummaryCard label="Edited rows" value={String(editedRows)} />
        <SummaryCard label="Uploaded by" value={upload.uploadedBy} />
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <div className="mt-2 text-xl font-semibold text-slate-50">{value}</div>
    </div>
  );
}

async function getDetailOrNotFound(uploadId: string) {
  try {
    return await getUploadResultsAction(uploadId);
  } catch {
    notFound();
  }
}
