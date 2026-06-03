import { FileBarChart2 } from "lucide-react";

import { PlaceholderPage } from "@/components/dashboard/placeholder-page";

export default function ResultsPage() {
  return (
    <PlaceholderPage
      actionLabel="Create result batch"
      description="Subject result management will plug into this workspace without changing the shell."
      emptyDescription="No results have been published yet."
      emptyTitle="No results yet"
      eyebrow="Results"
      filterPlaceholder="Search results"
      icon={FileBarChart2}
      tableDescription="Published and draft result records will appear here in future phases."
      tableTitle="Result workbook"
      title="Result publishing will sit on this foundation."
    />
  );
}
