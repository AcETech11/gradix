import { GraduationCap } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";

export function PromotionEmptyState() {
  return (
    <EmptyState
      icon={GraduationCap}
      title="No classes available for promotion"
      description="Create active classes first, then return here to promote students into their next academic year."
    />
  );
}
