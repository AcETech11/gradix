import type { StudentStatus } from "@/types/database";

export const PROMOTION_STUDENT_STATUSES = [
  "active",
  "repeated",
  "graduated",
  "transferred",
  "withdrawn",
  "archived",
] as const satisfies StudentStatus[];

export function isStudentTemplateEligible(status: StudentStatus, isActive: boolean) {
  return isActive && (status === "active" || status === "repeated");
}

export function getStudentStatusLabel(status: StudentStatus) {
  const labels: Record<StudentStatus, string> = {
    active: "Active",
    inactive: "Inactive",
    repeated: "Repeated",
    graduated: "Graduated",
    transferred: "Transferred",
    withdrawn: "Withdrawn",
    archived: "Archived",
  };

  return labels[status];
}
