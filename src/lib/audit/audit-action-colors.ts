import type { AuditAction } from "@/types/database";

export type AuditActionTone = "blue" | "green" | "gray" | "orange" | "purple" | "red";

export function getAuditActionTone(action: AuditAction): AuditActionTone {
  if (action === "insert") {
    return "blue";
  }

  if (action === "publish") {
    return "green";
  }

  if (action === "unpublish") {
    return "gray";
  }

  if (action === "validate") {
    return "purple";
  }

  if (action === "delete") {
    return "red";
  }

  return "orange";
}
