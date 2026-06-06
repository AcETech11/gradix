import type { AuthProfile } from "@/types/auth";

export function canManageStudents(profile: AuthProfile) {
  return profile.role === "admin";
}

export function canManageResults(profile: AuthProfile) {
  return profile.role === "admin";
}

export function canPublishResults(profile: AuthProfile) {
  return profile.role === "admin" || profile.role === "headmaster";
}

export function canViewAuditLogs(profile: AuthProfile) {
  return profile.role === "admin" || profile.role === "headmaster";
}

export function canViewAnalytics(profile: AuthProfile) {
  return profile.role === "admin" || profile.role === "headmaster";
}

export function canManageSettings(profile: AuthProfile) {
  return profile.role === "admin";
}

export function canViewSettings(profile: AuthProfile) {
  return profile.role === "admin" || profile.role === "headmaster";
}

export function canManageUsers(profile: AuthProfile) {
  return profile.role === "admin";
}

export function canUseResultOperations(profile: AuthProfile) {
  return profile.role === "admin" || profile.role === "headmaster";
}
