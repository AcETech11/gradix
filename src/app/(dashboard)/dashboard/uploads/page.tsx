import { UploadCloud } from "lucide-react";

import { PlaceholderPage } from "@/components/dashboard/placeholder-page";

export default function UploadsPage() {
  return (
    <PlaceholderPage
      actionLabel="Start upload"
      description="Result upload batches and validation history will live here once the engine is built."
      emptyDescription="Result uploads have not been created yet."
      emptyTitle="No uploads yet"
      eyebrow="Uploads"
      filterPlaceholder="Search uploads"
      icon={UploadCloud}
      tableDescription="Upload batches, validation status, and publish state will appear in this table."
      tableTitle="Upload queue"
      title="Uploads are staged for future workflow support."
    />
  );
}
