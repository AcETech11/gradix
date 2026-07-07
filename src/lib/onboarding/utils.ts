import type { Json } from "@/types/database";

export function slugifySchoolCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function slugifySchoolName(value: string) {
  return slugifySchoolCode(value.replace(/\b(schools?|college|academy)\b\s*$/i, ""));
}

export function buildSubjectCode(name: string) {
  const compact = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("");

  return (compact || name.trim().slice(0, 3).toUpperCase()).slice(0, 12);
}

export function getCurrentAcademicYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = month >= 7 ? year : year - 1;

  return `${start}/${start + 1}`;
}

export function toRecord(value: Json | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
}

export function getStringMetadata(value: Json | null | undefined, key: string, fallback = "") {
  const record = toRecord(value);
  const next = record[key];

  return typeof next === "string" ? next : fallback;
}

export function mergeMetadata(metadata: Json, values: Record<string, Json | undefined>): Json {
  return {
    ...toRecord(metadata),
    ...values,
  } as Json;
}
