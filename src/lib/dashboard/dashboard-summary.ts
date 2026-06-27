import { formatDistanceToNow } from "date-fns";

import { requireAdminOrHeadmaster } from "@/lib/auth/authorization";
import { getBillingExpiry, getBillingState, normalizeBillingPlan } from "@/lib/billing/billing";
import { createClient } from "@/lib/supabase/server";
import type { AuditAction, UploadStatus } from "@/types/database";

export type DashboardSummaryMetric = {
  label: string;
  value: string;
  helper: string;
};

export type DashboardSummarySetupItem = {
  label: string;
  complete: boolean;
};

export type DashboardSummaryActivity = {
  title: string;
  description: string;
  time: string;
};

export type DashboardSummaryData = {
  school: {
    name: string;
    code: string | null;
  };
  generatedAt: string;
  generatedBy: string;
  subscription: {
    status: string;
    plan: string;
    expiry: string | null;
  };
  metrics: DashboardSummaryMetric[];
  setup: {
    progress: number;
    items: DashboardSummarySetupItem[];
  };
  recentActivity: DashboardSummaryActivity[];
};

type AuditRow = {
  id: string;
  action: AuditAction;
  table_name: string;
  details: unknown;
  created_at: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function formatDate(value: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

function formatStatus(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getAuditTitle(row: AuditRow) {
  if (row.table_name === "result_uploads" && row.action === "insert") return "Result upload created";
  if (row.table_name === "result_uploads" && row.action === "publish") return "Results published";
  if (row.table_name === "results" && row.action === "update") return "Result score updated";
  if (row.table_name === "users") return "Staff record updated";
  if (row.table_name === "schools") return "School settings updated";

  return `${formatStatus(row.table_name)} ${formatStatus(row.action)}`;
}

function getAuditDescription(row: AuditRow) {
  return `Recorded ${formatStatus(row.action).toLowerCase()} activity for ${row.table_name.replace(/_/g, " ")}.`;
}

function calculateSetupProgress(items: DashboardSummarySetupItem[]) {
  if (!items.length) return 0;

  return Math.round((items.filter((item) => item.complete).length / items.length) * 100);
}

export async function getDashboardSummaryData(): Promise<DashboardSummaryData> {
  const profile = await requireAdminOrHeadmaster();
  const supabase = await createClient();

  const [
    schoolResult,
    studentsResult,
    classesResult,
    subjectsResult,
    resultsResult,
    uploadsResult,
    parentAccessResult,
    auditResult,
  ] = await Promise.all([
    supabase
      .from("schools")
      .select("name, school_code, subscription_status, subscription_plan, subscription_expires_at, subscription_ends_at, metadata")
      .eq("id", profile.school_id)
      .maybeSingle(),
    supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", profile.school_id).eq("is_active", true).eq("status", "active"),
    supabase.from("classes").select("id", { count: "exact", head: true }).eq("school_id", profile.school_id).eq("is_active", true),
    supabase.from("subjects").select("id", { count: "exact", head: true }).eq("school_id", profile.school_id).eq("is_active", true),
    supabase
      .from("results")
      .select("total_score")
      .eq("school_id", profile.school_id)
      .eq("is_published", true)
      .limit(5000),
    supabase
      .from("result_uploads")
      .select("id, status")
      .eq("school_id", profile.school_id)
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase.from("code_term_access").select("use_count").eq("school_id", profile.school_id).limit(1000),
    supabase
      .from("audit_logs")
      .select("id, action, table_name, details, created_at")
      .eq("school_id", profile.school_id)
      .in("table_name", ["result_uploads", "results", "users", "schools"])
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  for (const result of [schoolResult, studentsResult, classesResult, subjectsResult, resultsResult, uploadsResult, parentAccessResult, auditResult]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  if (!schoolResult.data) {
    throw new Error("This record was not found in your school workspace.");
  }

  const school = schoolResult.data;
  const publishedResults = resultsResult.data ?? [];
  const uploads = (uploadsResult.data ?? []) as Array<{ id: string; status: UploadStatus }>;
  const publishedCount = publishedResults.length;
  const averageScore = publishedCount
    ? publishedResults.reduce((sum, result) => sum + Number(result.total_score ?? 0), 0) / publishedCount
    : null;
  const parentChecks = (parentAccessResult.data ?? []).reduce((sum, access) => sum + Number(access.use_count ?? 0), 0);
  const pendingUploads = uploads.filter((upload) => upload.status === "draft" || upload.status === "validating" || upload.status === "validated").length;
  const setupItems = [
    { label: "School Information", complete: Boolean(school.name && school.school_code) },
    { label: "Classes Added", complete: Boolean(classesResult.count && classesResult.count > 0) },
    { label: "Subjects Added", complete: Boolean(subjectsResult.count && subjectsResult.count > 0) },
    { label: "Students Added", complete: Boolean(studentsResult.count && studentsResult.count > 0) },
    {
      label: "Result Template Ready",
      complete: Boolean((classesResult.count ?? 0) > 0 && (subjectsResult.count ?? 0) > 0 && (studentsResult.count ?? 0) > 0),
    },
    { label: "First Result Uploaded", complete: uploads.length > 0 },
    { label: "First Result Published", complete: publishedCount > 0 },
    { label: "Parent Checker Tested", complete: parentChecks > 0 },
  ];

  return {
    school: {
      name: school.name,
      code: school.school_code,
    },
    generatedAt: new Date().toISOString(),
    generatedBy: profile.full_name || profile.email || "Gradix user",
    subscription: {
      status: formatStatus(getBillingState(school)),
      plan: formatStatus(normalizeBillingPlan(school.subscription_plan)),
      expiry: formatDate(getBillingExpiry(school)),
    },
    metrics: [
      { label: "Total Students", value: formatNumber(studentsResult.count ?? 0), helper: "Active students in this school" },
      { label: "Active Classes", value: formatNumber(classesResult.count ?? 0), helper: "Classes currently configured" },
      { label: "Published Results", value: formatNumber(publishedCount), helper: "Published result records" },
      { label: "Parent Result Checks", value: formatNumber(parentChecks), helper: "Result-code usage recorded" },
      { label: "Pending Uploads", value: formatNumber(pendingUploads), helper: "Uploads awaiting publishing" },
      { label: "Average Score", value: averageScore === null ? "N/A" : averageScore.toFixed(1), helper: "Across published result records" },
    ],
    setup: {
      progress: calculateSetupProgress(setupItems),
      items: setupItems,
    },
    recentActivity: ((auditResult.data ?? []) as AuditRow[]).map((row) => ({
      title: getAuditTitle(row),
      description: getAuditDescription(row),
      time: formatDistanceToNow(new Date(row.created_at), { addSuffix: true }),
    })),
  };
}
