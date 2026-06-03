import { ShieldAlert } from "lucide-react";

import { PlaceholderPage } from "@/components/dashboard/placeholder-page";

export default function AuditPage() {
  return (
    <PlaceholderPage
      actionLabel="Review logs"
      description="Activity and compliance events will appear here once audit tracking expands."
      emptyDescription="There are no audit entries to show yet."
      emptyTitle="No audit logs yet"
      eyebrow="Audit"
      filterPlaceholder="Search audit events"
      icon={ShieldAlert}
      tableDescription="System events, publishing actions, and administrative changes will be listed here."
      tableTitle="Activity stream"
      title="Audit visibility is ready for future governance workflows."
    />
  );
}
