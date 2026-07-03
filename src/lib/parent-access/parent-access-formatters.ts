import type { SchoolTerm } from "@/types/database";

export function formatTerm(term: SchoolTerm) {
  const labels: Record<SchoolTerm, string> = {
    first: "First Term",
    second: "Second Term",
    third: "Third Term",
  };

  return labels[term];
}

export function formatViews(used: number, max: number | null) {
  if (max === null) return `${used} views used / Unlimited`;

  return `${used} / ${max} views used`;
}

export function formatRemaining(used: number, max: number | null) {
  if (max === null) return "Unlimited views remaining";

  return `${Math.max(max - used, 0)} views remaining`;
}

export function buildStudentName(student: { first_name: string; middle_name: string | null; last_name: string }) {
  return [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ");
}
