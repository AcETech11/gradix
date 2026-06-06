import type { Json } from "@/types/database";

type JsonObject = Record<string, Json | undefined>;

function isObject(value: Json): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function objectValue(value: Json | undefined): JsonObject {
  const normalized = value ?? null;

  return isObject(normalized) ? normalized : {};
}

function text(value: Json | undefined, fallback = "Unknown") {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function formatTerm(value: Json | undefined) {
  const term = text(value, "").replace(/_/g, " ");

  if (!term) {
    return "term";
  }

  return `${term.charAt(0).toUpperCase()}${term.slice(1)} Term`;
}

function scoreLine(label: string, oldValue: Json | undefined, newValue: Json | undefined) {
  return `${label}: ${text(oldValue, "-")} -> ${text(newValue, "-")}`;
}

export function formatAuditEntity(entity: string) {
  return entity
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function formatAuditAction(action: string) {
  if (action === "insert") {
    return "Create";
  }

  if (action === "update") {
    return "Edit";
  }

  if (action === "delete") {
    return "Archive/Delete";
  }

  return `${action.charAt(0).toUpperCase()}${action.slice(1)}`;
}

export function formatAuditSummary(action: string, entity: string, details: Json) {
  if (!isObject(details)) {
    return `${formatAuditAction(action)} on ${formatAuditEntity(entity)}`;
  }

  if (entity === "results" && action === "update") {
    return `Changed ${text(details.subject, "subject")} score for ${text(details.student_name, "student")}`;
  }

  if (entity === "result_uploads" && (action === "publish" || action === "unpublish")) {
    return `${formatAuditAction(action)}ed ${formatTerm(details.term)} ${text(details.academic_year, "")}`.trim();
  }

  if (entity === "students") {
    return `${formatAuditAction(action)} student record`;
  }

  return `${formatAuditAction(action)} on ${formatAuditEntity(entity)}`;
}

export function formatAuditDetailLines(action: string, entity: string, details: Json) {
  if (!isObject(details)) {
    return ["No structured details were recorded for this event."];
  }

  if (entity === "results" && action === "update") {
    const oldValues = objectValue(details.old_values);
    const newValues = objectValue(details.new_values);

    return [
      `Changed ${text(details.subject, "subject")} score for ${text(details.student_name, "student")}:`,
      scoreLine("CA", oldValues.continuous_assessment, newValues.continuous_assessment),
      scoreLine("Exam", oldValues.exam_score, newValues.exam_score),
      scoreLine("Remark", oldValues.remark, newValues.remark),
    ];
  }

  if (entity === "result_uploads" && (action === "publish" || action === "unpublish")) {
    return [
      `${formatAuditAction(action)}ed ${formatTerm(details.term)} ${text(details.academic_year, "")}`.trim(),
      `Class: ${text(details.class_name ?? details.class_id)}`,
      `Result rows: ${text(details.result_count, "0")}`,
    ];
  }

  const lines = Object.entries(details)
    .filter(([, value]) => value !== null && value !== undefined)
    .slice(0, 12)
    .map(([key, value]) => `${formatAuditEntity(key)}: ${typeof value === "object" ? JSON.stringify(value) : text(value)}`);

  return lines.length ? lines : ["No structured details were recorded for this event."];
}

export function matchesAuditSearch(values: string[], search: string | undefined) {
  const normalizedSearch = search?.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return values.some((value) => value.toLowerCase().includes(normalizedSearch));
}

export function getFlaggedEditValues(details: Json) {
  if (!isObject(details) || details.edited_after_publish !== true) {
    return null;
  }

  const oldValues = objectValue(details.old_values);
  const newValues = objectValue(details.new_values);

  return {
    student: text(details.student_name, "Unknown student"),
    subject: text(details.subject, "Unknown subject"),
    oldScore: `${text(oldValues.continuous_assessment, "0")} + ${text(oldValues.exam_score, "0")}`,
    newScore: `${text(newValues.continuous_assessment, "0")} + ${text(newValues.exam_score, "0")}`,
  };
}
