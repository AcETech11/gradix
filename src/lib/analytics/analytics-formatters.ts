import type { SchoolTerm } from "@/types/database";

export const TERM_LABELS: Record<SchoolTerm, string> = {
  first: "First Term",
  second: "Second Term",
  third: "Third Term",
};

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

export function formatPercent(value: number) {
  return `${value}%`;
}

export function formatScore(value: number) {
  return value ? value.toFixed(1) : "0.0";
}

export function getTermRank(term: SchoolTerm) {
  return term === "third" ? 3 : term === "second" ? 2 : 1;
}
