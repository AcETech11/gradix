import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { DatabaseAccessError, DatabaseAuthError } from "@/lib/supabase/database";
import { hasPermission, isDashboardRole } from "@/lib/auth/permissions";
import type { AuthPermission, AuthProfile, AuthRole, AuthSchool, AuthUser } from "@/types/auth";

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
});

export const requireAuth = cache(async (): Promise<AuthUser> => {
  const user = await getCurrentUser();

  if (!user) {
    throw new DatabaseAuthError();
  }

  return user;
});

export const getCurrentUserProfile = cache(async (): Promise<AuthProfile | null> => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle();

  if (error || !data || !data.is_active) {
    return null;
  }

  return data;
});

export async function requireRole(roles: AuthRole[]): Promise<AuthProfile> {
  const profile = await getCurrentUserProfile();

  if (!profile || !isDashboardRole(profile.role) || !roles.includes(profile.role)) {
    throw new DatabaseAccessError();
  }

  return profile;
}

export async function requirePermission(permission: AuthPermission) {
  const profile = await getCurrentUserProfile();

  if (!profile || !isDashboardRole(profile.role) || !hasPermission(profile.role, permission)) {
    throw new DatabaseAccessError();
  }

  return profile;
}

export const getCurrentSchool = cache(async (): Promise<AuthSchool | null> => {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("schools").select("*").eq("id", profile.school_id).maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
});
