import { FileBarChart2 } from "lucide-react";

import { getResultUploadsAction } from "@/actions/results/get-result-uploads-action";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { ResultUploadsTable } from "@/components/results/ResultUploadsTable";

export default async function ResultsPage() {
  const uploads = await getResultUploadsAction();

  return (
    <div className="space-y-6">
      <PageHeader
        description="Review uploaded result batches, publish official results, unpublish when needed, and preserve an audit trail for every sensitive change."
        eyebrow="Results"
        title="Result publishing and review"
      />

      {uploads.length === 0 ? (
        <EmptyState
          description="Validated result uploads will appear here after Phase 8 uploads are saved."
          icon={FileBarChart2}
          title="No result uploads yet"
        />
      ) : (
        <ResultUploadsTable uploads={uploads} />
      )}
    </div>
  );
}
