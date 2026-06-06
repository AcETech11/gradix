import { Fingerprint } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";

export function ParentAccessEmptyState({ type }: { type: "no_published_results" | "no_parent_checks" }) {
  if (type === "no_published_results") {
    return (
      <EmptyState
        icon={Fingerprint}
        title="No published results yet"
        description="Publish results first before parent access tracking begins."
      />
    );
  }

  return (
    <EmptyState
      icon={Fingerprint}
      title="No parent result checks yet"
      description="Parent access activity will appear after parents start checking results."
    />
  );
}
