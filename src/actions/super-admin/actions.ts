"use server";

import { revalidatePath } from "next/cache";

import { requirePlatformAdmin } from "@/lib/platform-admin/auth";
import { normalizePlatformPlan, normalizePlatformStatus, platformPlanPrices, toSubscriptionStatus } from "@/lib/platform-admin/billing";
import { demoRequestStatusSchema, subscriptionUpdateSchema, type DemoRequestStatusInput, type SubscriptionUpdateInput } from "@/lib/platform-admin/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export type SuperAdminSchool = {
  id: string;
  name: string;
  ownerName: string;
  email: string | null;
  phone: string | null;
  plan: "starter" | "standard" | "premium";
  status: "trial" | "active" | "expired" | "suspended";
  expiresAt: string | null;
  studentLimit: number | null;
  studentCount: number;
  createdAt: string;
  billingNote: string;
};

export async function getSuperAdminData() {
  const platformAdmin = await requirePlatformAdmin();
  const supabase = createAdminClient();
  const [schoolsResult, usersResult, studentsResult, demoRequestsResult] = await Promise.all([
    supabase.from("schools").select("id, name, email, phone, subscription_status, subscription_plan, subscription_expires_at, subscription_ends_at, student_limit, metadata, created_at").order("created_at", { ascending: false }),
    supabase.from("users").select("school_id, full_name, role, created_at").eq("role", "admin").order("created_at", { ascending: true }),
    supabase.from("students").select("school_id, id").neq("status", "archived"),
    supabase.from("demo_requests").select("*").order("created_at", { ascending: false }),
  ]);

  if (schoolsResult.error) throw new Error(schoolsResult.error.message);
  if (usersResult.error) throw new Error(usersResult.error.message);
  if (studentsResult.error) throw new Error(studentsResult.error.message);
  if (demoRequestsResult.error) throw new Error(demoRequestsResult.error.message);

  const adminBySchool = new Map<string, string>();
  (usersResult.data ?? []).forEach((user) => {
    if (!adminBySchool.has(user.school_id)) adminBySchool.set(user.school_id, user.full_name);
  });
  const studentCounts = new Map<string, number>();
  (studentsResult.data ?? []).forEach((student) => studentCounts.set(student.school_id, (studentCounts.get(student.school_id) ?? 0) + 1));

  const schools: SuperAdminSchool[] = (schoolsResult.data ?? []).map((school) => {
    const metadata = school.metadata;
    const metadataObject = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {};
    const expiresAt = school.subscription_expires_at ?? school.subscription_ends_at;
    const plan = normalizePlatformPlan(school.subscription_plan);

    return {
      id: school.id,
      name: school.name,
      ownerName: adminBySchool.get(school.id) ?? "No admin",
      email: school.email,
      phone: school.phone,
      plan,
      status: normalizePlatformStatus(school.subscription_status, metadata, expiresAt),
      expiresAt,
      studentLimit: school.student_limit,
      studentCount: studentCounts.get(school.id) ?? 0,
      createdAt: school.created_at,
      billingNote: typeof metadataObject.billing_note === "string" ? metadataObject.billing_note : "",
    };
  });

  const overview = {
    totalSchools: schools.length,
    activeSchools: schools.filter((school) => school.status === "active").length,
    trialSchools: schools.filter((school) => school.status === "trial").length,
    expiredSchools: schools.filter((school) => school.status === "expired").length,
    suspendedSchools: schools.filter((school) => school.status === "suspended").length,
    totalStudents: schools.reduce((total, school) => total + school.studentCount, 0),
    demoRequests: demoRequestsResult.data?.length ?? 0,
    estimatedRevenue: schools.filter((school) => school.status === "active").reduce((total, school) => total + platformPlanPrices[school.plan], 0),
  };

  return {
    platformAdmin,
    overview,
    schools,
    demoRequests: demoRequestsResult.data ?? [],
  };
}

export async function updateSchoolSubscriptionAction(input: SubscriptionUpdateInput) {
  const parsed = subscriptionUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the subscription details and try again.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const platformAdmin = await requirePlatformAdmin();
  const supabase = createAdminClient();
  const { data: school, error: lookupError } = await supabase.from("schools").select("id, metadata, subscription_plan, student_limit").eq("id", parsed.data.schoolId).maybeSingle();

  if (lookupError || !school) {
    return { ok: false, message: lookupError?.message ?? "School was not found." };
  }

  const metadata = mergeMetadata(school.metadata, {
    billing_status: parsed.data.subscriptionStatus,
    billing_note: parsed.data.billingNote ?? "",
  });
  const { error } = await supabase
    .from("schools")
    .update({
      subscription_status: toSubscriptionStatus(parsed.data.subscriptionStatus),
      subscription_plan: parsed.data.subscriptionPlan,
      subscription_expires_at: parsed.data.subscriptionExpiresAt || null,
      student_limit: parsed.data.studentLimit,
      metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.schoolId);

  if (error) return { ok: false, message: error.message };

  await supabase.from("platform_audit_logs").insert({
    platform_admin_id: platformAdmin.id,
    actor_user_id: platformAdmin.user_id,
    action: "school_subscription_updated",
    entity_type: "school",
    entity_id: parsed.data.schoolId,
    details: {
      status: parsed.data.subscriptionStatus,
      plan: parsed.data.subscriptionPlan,
      student_limit: parsed.data.studentLimit,
      billing_note_changed: Boolean(parsed.data.billingNote),
    },
  });

  revalidatePath("/super-admin");
  revalidatePath("/dashboard/billing");
  return { ok: true, message: "School subscription updated successfully." };
}

export async function updateDemoRequestStatusAction(input: DemoRequestStatusInput) {
  const parsed = demoRequestStatusSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Choose a valid demo request status." };
  }

  const platformAdmin = await requirePlatformAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("demo_requests").update({ status: parsed.data.status }).eq("id", parsed.data.requestId);

  if (error) return { ok: false, message: error.message };

  await supabase.from("platform_audit_logs").insert({
    platform_admin_id: platformAdmin.id,
    actor_user_id: platformAdmin.user_id,
    action: "demo_request_status_changed",
    entity_type: "demo_request",
    entity_id: parsed.data.requestId,
    details: { status: parsed.data.status },
  });

  revalidatePath("/super-admin");
  return { ok: true, message: "Demo request status updated." };
}

function mergeMetadata(metadata: Json, updates: Record<string, Json>) {
  const base = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {};
  return { ...base, ...updates };
}
