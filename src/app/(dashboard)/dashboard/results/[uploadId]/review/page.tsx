import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { getUploadResultsAction } from "@/actions/results/get-upload-results-action";
import { PageHeader } from "@/components/dashboard/page-header";
import { PostPublishEditWarning } from "@/components/results/PostPublishEditWarning";
import { PublishConfirmationDialog } from "@/components/results/PublishConfirmationDialog";
import { ResultReviewTable } from "@/components/results/ResultReviewTable";
import { ResultStatusBadge } from "@/components/results/ResultStatusBadge";
import { UnpublishConfirmationDialog } from "@/components/results/UnpublishConfirmationDialog";

type ResultReviewPageProps = {
  params: Promise<{ uploadId: string }>;
};

export default async function ResultReviewPage({ params }: ResultReviewPageProps) {
  const { uploadId } = await params;
  const { upload, rows } = await getDetailOrNotFound(uploadId);
  const hasPublishedRows = rows.some((row) => row.isPublished);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            {upload.canPublish ? <PublishConfirmationDialog uploadId={upload.id} /> : null}
            {upload.canUnpublish ? <UnpublishConfirmationDialog uploadId={upload.id} /> : null}
          </>
        }
        description={`${upload.className} · ${upload.term} term · ${upload.academicYear}`}
        eyebrow="Review Results"
        title={upload.sourceFilename}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Status" value={<ResultStatusBadge status={upload.status} />} />
        <SummaryCard label="Result rows" value={String(rows.length)} />
        <SummaryCard label="Published rows" value={String(rows.filter((row) => row.isPublished).length)} />
        <SummaryCard label="Edited rows" value={String(rows.filter((row) => row.editCount > 0).length)} />
      </section>

      {hasPublishedRows && upload.canEdit ? <PostPublishEditWarning /> : null}

      <ResultReviewTable canEdit={upload.canEdit} rows={rows} uploadId={upload.id} />
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
