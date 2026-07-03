import type { ParentAccessRecord } from "@/lib/parent-access/parent-access-types";

export function calculateAccessStatus(input: {
  hasPublishedResult: boolean;
  viewsUsed: number;
  maxViews: number | null;
}): ParentAccessRecord["status"] {
  if (!input.hasPublishedResult) {
    return "no_published_result";
  }

  if (input.maxViews !== null && input.viewsUsed >= input.maxViews) {
    return "limit_reached";
  }

  if (input.viewsUsed > 0) {
    return "checked";
  }

  return "not_checked";
}

export function matchesAccessStatus(record: ParentAccessRecord, status: string | undefined) {
  return !status || status === "all" || record.status === status;
}
