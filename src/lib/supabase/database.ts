import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { PublicTableName, TableRow } from "@/types/database";

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
export type UserProfile = TableRow<"users">;

export class DatabaseAuthError extends Error {
  constructor(message = "You must be signed in to access this resource.") {
    super(message);
    this.name = "DatabaseAuthError";
  }
}

export class DatabaseAccessError extends Error {
  constructor(message = "You do not have access to this resource.") {
    super(message);
    this.name = "DatabaseAccessError";
  }
}

export const getCurrentUserProfile = cache(async (): Promise<UserProfile> => {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new DatabaseAuthError();
  }

  const { data: profile, error } = await supabase.from("users").select("*").eq("id", user.id).single();

  if (error || !profile || !profile.is_active) {
    throw new DatabaseAccessError("No active Gradix profile is available for this account.");
  }

  return profile;
});

export const getCurrentSchoolId = cache(async () => {
  const profile = await getCurrentUserProfile();

  return profile.school_id;
});

export async function requireRole(allowedRoles: UserProfile["role"][]) {
  const profile = await getCurrentUserProfile();

  if (!allowedRoles.includes(profile.role)) {
    throw new DatabaseAccessError();
  }

  return profile;
}

export async function createTenantQueryClient() {
  const [supabase, schoolId] = await Promise.all([createClient(), getCurrentSchoolId()]);

  return {
    supabase,
    schoolId,
  };
}

type SchoolScopedTableName = {
  [TTable in PublicTableName]: "school_id" extends keyof TableRow<TTable> ? TTable : never;
}[PublicTableName];

export async function getSchoolScopedRows<TTable extends SchoolScopedTableName>(table: TTable, columns = "*") {
  const { supabase, schoolId } = await createTenantQueryClient();

  switch (table) {
    case "users":
      return supabase.from("users").select(columns).eq("school_id", schoolId);
    case "classes":
      return supabase.from("classes").select(columns).eq("school_id", schoolId);
    case "subjects":
      return supabase.from("subjects").select(columns).eq("school_id", schoolId);
    case "class_subjects":
      return supabase.from("class_subjects").select(columns).eq("school_id", schoolId);
    case "students":
      return supabase.from("students").select(columns).eq("school_id", schoolId);
    case "result_uploads":
      return supabase.from("result_uploads").select(columns).eq("school_id", schoolId);
    case "results":
      return supabase.from("results").select(columns).eq("school_id", schoolId);
    case "code_term_access":
      return supabase.from("code_term_access").select(columns).eq("school_id", schoolId);
    case "audit_logs":
      return supabase.from("audit_logs").select(columns).eq("school_id", schoolId);
    default:
      throw new DatabaseAccessError("This table is not available as a school-scoped query.");
  }
}
