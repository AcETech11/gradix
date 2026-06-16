import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth/session";
import {
  canManageResults,
  canManageSettings,
  canManageStudents,
  canManageUsers,
  canPublishResults,
  canUseResultOperations,
  canViewAnalytics,
  canViewAuditLogs,
  canViewSettings,
} from "@/lib/permissions/roles";
import { DatabaseAccessError } from "@/lib/supabase/database";
import type { AuthProfile } from "@/types/auth";
import type { PublicTableName, TableRow } from "@/types/database";

export async function requireAuthenticatedUser() {
  return requireAuth();
}

export async function requireSchoolContext() {
  const profile = await requireRole(["admin", "headmaster", "teacher"]);

  return {
    profile,
    schoolId: profile.school_id,
  };
}

export async function requireAdmin() {
  return requireRole(["admin"]);
}

export async function requireAdminOrHeadmaster() {
  return requireRole(["admin", "headmaster"]);
}

export async function requireCanManageStudents() {
  const profile = await requireRole(["admin"]);

  if (!canManageStudents(profile)) {
    throw new DatabaseAccessError("Only admins can manage students.");
  }

  return profile;
}

export async function requireCanManageResultOperations() {
  const profile = await requireRole(["admin", "headmaster"]);

  if (!canUseResultOperations(profile)) {
    throw new DatabaseAccessError("Only admins and headmasters can manage result operations.");
  }

  return profile;
}

export async function requireCanManageResults() {
  const profile = await requireRole(["admin"]);

  if (!canManageResults(profile)) {
    throw new DatabaseAccessError("Only admins can edit result scores.");
  }

  return profile;
}

export async function requireCanPublishResults() {
  const profile = await requireRole(["admin", "headmaster"]);

  if (!canPublishResults(profile)) {
    throw new DatabaseAccessError("Only admins and headmasters can publish results.");
  }

  return profile;
}

export async function requireCanViewAuditLogs() {
  const profile = await requireRole(["admin", "headmaster"]);

  if (!canViewAuditLogs(profile)) {
    throw new DatabaseAccessError("You do not have permission to view audit logs.");
  }

  return profile;
}

export async function requireCanViewAnalytics() {
  const profile = await requireRole(["admin", "headmaster"]);

  if (!canViewAnalytics(profile)) {
    throw new DatabaseAccessError("You do not have permission to view analytics.");
  }

  return profile;
}

export async function requireCanViewSettings() {
  const profile = await requireRole(["admin", "headmaster"]);

  if (!canViewSettings(profile)) {
    throw new DatabaseAccessError("You do not have permission to view settings.");
  }

  return profile;
}

export async function requireCanManageSettings() {
  const profile = await requireRole(["admin"]);

  if (!canManageSettings(profile)) {
    throw new DatabaseAccessError("Only admins can manage settings.");
  }

  return profile;
}

export async function requireCanManageUsers() {
  const profile = await requireRole(["admin"]);

  if (!canManageUsers(profile)) {
    throw new DatabaseAccessError("Only admins can manage users.");
  }

  return profile;
}

type SchoolScopedTableName = {
  [TTable in PublicTableName]: "school_id" extends keyof TableRow<TTable> ? TTable : never;
}[PublicTableName];

export async function assertResourceBelongsToSchool(
  table: SchoolScopedTableName,
  resourceId: string,
  schoolId: string,
) {
  const supabase = await createClient();
  const query = (() => {
    switch (table) {
      case "users":
        return supabase.from("users").select("id").eq("id", resourceId).eq("school_id", schoolId).maybeSingle();
      case "classes":
        return supabase.from("classes").select("id").eq("id", resourceId).eq("school_id", schoolId).maybeSingle();
      case "subjects":
        return supabase.from("subjects").select("id").eq("id", resourceId).eq("school_id", schoolId).maybeSingle();
      case "class_subjects":
        return supabase.from("class_subjects").select("id").eq("id", resourceId).eq("school_id", schoolId).maybeSingle();
      case "students":
        return supabase.from("students").select("id").eq("id", resourceId).eq("school_id", schoolId).maybeSingle();
      case "student_class_enrollments":
        return supabase.from("student_class_enrollments").select("id").eq("id", resourceId).eq("school_id", schoolId).maybeSingle();
      case "result_uploads":
        return supabase.from("result_uploads").select("id").eq("id", resourceId).eq("school_id", schoolId).maybeSingle();
      case "results":
        return supabase.from("results").select("id").eq("id", resourceId).eq("school_id", schoolId).maybeSingle();
      case "code_term_access":
        return supabase.from("code_term_access").select("id").eq("id", resourceId).eq("school_id", schoolId).maybeSingle();
      case "audit_logs":
        return supabase.from("audit_logs").select("id").eq("id", resourceId).eq("school_id", schoolId).maybeSingle();
      default:
        throw new DatabaseAccessError("This resource is not school scoped.");
    }
  })();
  const { data, error } = await query;

  if (error || !data) {
    throw new DatabaseAccessError("This record was not found in your school workspace.");
  }

  return data;
}

export function requireSameSchoolResource(profile: AuthProfile, resourceSchoolId: string | null | undefined) {
  if (!resourceSchoolId || resourceSchoolId !== profile.school_id) {
    throw new DatabaseAccessError("This record was not found in your school workspace.");
  }
}
