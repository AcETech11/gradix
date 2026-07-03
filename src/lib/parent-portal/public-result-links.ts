import type { SchoolTerm } from "@/types/database";

export type ParentShareMessageInput = {
  schoolName: string;
  studentName: string;
  studentCode: string;
  className?: string | null;
  term?: SchoolTerm | string | null;
  academicYear?: string | null;
  schoolPortalLink: string;
  directResultLink: string;
};

export function getCanonicalAppBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  const rawUrl = configuredUrl || vercelUrl || "http://localhost:3000";

  return rawUrl.replace(/\/+$/, "");
}

export function buildSchoolPortalLink({ baseUrl = getCanonicalAppBaseUrl(), schoolSlug }: { baseUrl?: string; schoolSlug: string }) {
  return `${baseUrl}/s/${encodeURIComponent(schoolSlug)}/results`;
}

export function buildStudentResultLink({
  baseUrl = getCanonicalAppBaseUrl(),
  schoolSlug,
  studentCode,
}: {
  baseUrl?: string;
  schoolSlug: string;
  studentCode: string;
}) {
  return `${buildSchoolPortalLink({ baseUrl, schoolSlug })}/${encodeURIComponent(studentCode)}`;
}

export function formatTermLabel(term?: SchoolTerm | string | null) {
  if (!term) return "";

  return `${term.charAt(0).toUpperCase()}${term.slice(1)} Term`;
}

export function buildParentShareMessage({
  schoolName,
  studentName,
  studentCode,
  className,
  term,
  academicYear,
  schoolPortalLink,
  directResultLink,
}: ParentShareMessageInput) {
  return [
    "Hello,",
    "",
    `${schoolName} has published the result for ${studentName}.`,
    "",
    className ? `Class: ${className}` : null,
    term ? `Term: ${formatTermLabel(term)}` : null,
    academicYear ? `Academic Year: ${academicYear}` : null,
    "",
    `Result Code: ${studentCode}`,
    "",
    "Check the result here:",
    schoolPortalLink,
    "",
    "You can also open the result directly:",
    directResultLink,
    "",
    "Please keep the result code and link private.",
    "",
    "Securely powered by Gradix.",
  ]
    .filter((line) => line !== null)
    .join("\n");
}
