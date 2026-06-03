"use server";

import { requirePermission, requireRole } from "@/lib/auth/session";
import type { AuthPermission, AuthRole } from "@/types/auth";

export async function protectServerActionByRole<T>(roles: AuthRole[], action: () => Promise<T>) {
  await requireRole(roles);

  return action();
}

export async function protectServerActionByPermission<T>(permission: AuthPermission, action: () => Promise<T>) {
  await requirePermission(permission);

  return action();
}
