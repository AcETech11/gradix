import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { TableRow } from "@/types/database";

export type PlatformAdmin = TableRow<"platform_admins">;

export async function getCurrentPlatformAdmin() {
  const supabase = await createClient();
  const { data: authUser, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("platform_admins")
    .select("*")
    .eq("user_id", authUser.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function requirePlatformAdmin() {
  const admin = await getCurrentPlatformAdmin();

  if (!admin) {
    redirect("/login?error=super-admin");
  }

  return admin;
}
