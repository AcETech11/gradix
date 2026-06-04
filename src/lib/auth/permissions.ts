import type { AuthPermission, AuthRole } from "@/types/auth";

export const ROLE_HOME_PATHS: Record<AuthRole, string> = {
  admin: "/dashboard",
  headmaster: "/dashboard",
  teacher: "/dashboard",
};

export const ROLE_PERMISSIONS: Record<AuthRole, AuthPermission[]> = {
  admin: [
    "dashboard:view",
    "school:manage",
    "users:manage",
    "classes:manage",
    "students:manage",
    "results:edit",
    "results:publish",
    "audit_logs:view",
  ],
  headmaster: [
    "dashboard:view",
    "classes:manage",
    "results:edit",
    "results:publish",
    "audit_logs:view",
  ],
  teacher: ["dashboard:view", "results:edit", "students:manage"],
};

export function isDashboardRole(role: string | null | undefined): role is AuthRole {
  return role === "admin" || role === "headmaster" || role === "teacher";
}

export function getRoleHomePath(role: AuthRole) {
  return ROLE_HOME_PATHS[role];
}

export function hasPermission(role: AuthRole, permission: AuthPermission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAccessDashboardPath(role: AuthRole, pathname: string) {
  if (role === "admin") {
    return true;
  }

  if (role === "headmaster") {
    return !pathname.startsWith("/dashboard/settings");
  }

  return !pathname.startsWith("/dashboard/audit") && !pathname.startsWith("/dashboard/settings");
}
