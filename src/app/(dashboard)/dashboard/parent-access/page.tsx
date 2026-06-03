import { Fingerprint } from "lucide-react";

import { PlaceholderPage } from "@/components/dashboard/placeholder-page";

export default function ParentAccessPage() {
  return (
    <PlaceholderPage
      actionLabel="Configure codes"
      description="Parent result access controls will live here once code-term workflows are implemented."
      emptyDescription="No parent access records are available yet."
      emptyTitle="No parent access yet"
      eyebrow="Parent Access"
      filterPlaceholder="Search access codes"
      icon={Fingerprint}
      tableDescription="Code-term activity and access history will be surfaced here later."
      tableTitle="Access codes"
      title="Parent access is reserved for future portal controls."
    />
  );
}
