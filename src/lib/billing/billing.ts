import { getMetadataObject, getMetadataString } from "@/lib/settings/settings-types";
import type { TableRow } from "@/types/database";

export type BillingPlan = "starter" | "standard" | "premium";
export type BillingState = "trial" | "active" | "expired" | "suspended";

export const PLAN_LIMITS: Record<BillingPlan, number> = {
  starter: 300,
  standard: 700,
  premium: 1500,
};

export const PLAN_PRICES: Record<BillingPlan, string> = {
  starter: "NGN 60,000 / term",
  standard: "NGN 90,000 / term",
  premium: "NGN 150,000+ / term",
};

export function normalizeBillingPlan(value: string | null | undefined): BillingPlan {
  return value === "standard" || value === "premium" ? value : "starter";
}

export function getBillingState(school: Pick<TableRow<"schools">, "subscription_status" | "subscription_expires_at" | "subscription_ends_at" | "metadata">): BillingState {
  const metadata = getMetadataObject(school.metadata);
  const metadataStatus = getMetadataString(metadata, "billing_status");
  const rawStatus = metadataStatus || school.subscription_status;

  if (rawStatus === "suspended" || rawStatus === "paused" || rawStatus === "canceled") {
    return "suspended";
  }

  if (rawStatus === "trial" || rawStatus === "trialing") {
    return "trial";
  }

  const expiry = school.subscription_expires_at ?? school.subscription_ends_at;

  if (expiry && new Date(expiry).getTime() < Date.now()) {
    return "expired";
  }

  if (rawStatus === "expired" || rawStatus === "past_due") {
    return "expired";
  }

  return "active";
}

export function getBillingExpiry(school: Pick<TableRow<"schools">, "subscription_expires_at" | "subscription_ends_at">) {
  return school.subscription_expires_at ?? school.subscription_ends_at;
}

export function getStudentLimit(school: Pick<TableRow<"schools">, "subscription_plan" | "student_limit">) {
  return school.student_limit ?? PLAN_LIMITS[normalizeBillingPlan(school.subscription_plan)];
}

export function isExpiringSoon(expiry: string | null) {
  if (!expiry) return false;

  const diff = new Date(expiry).getTime() - Date.now();

  return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

export function canMutatePaidWorkflow(state: BillingState) {
  return state === "trial" || state === "active";
}

export function getBillingBlockMessage(state: BillingState) {
  if (state === "suspended") {
    return "Your school account is suspended. Contact Gradix support.";
  }

  if (state === "expired") {
    return "Your subscription has expired. Renew to continue using Gradix.";
  }

  return null;
}
