import type { Session, User } from "@supabase/supabase-js";

import type { AppRole, TableRow } from "@/types/database";

export type AuthRole = Exclude<AppRole, "parent">;
export type AuthUser = User;
export type AuthSession = Session;
export type AuthProfile = TableRow<"users">;
export type AuthSchool = TableRow<"schools">;

export type AuthPermission =
  | "dashboard:view"
  | "school:manage"
  | "users:manage"
  | "classes:manage"
  | "students:manage"
  | "results:edit"
  | "results:publish"
  | "audit_logs:view";

export type AuthActionState<TData = unknown> = {
  ok: boolean;
  message: string;
  data?: TData;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type LoginRedirect = {
  redirectTo: string;
};
