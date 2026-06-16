import type { Json, SubscriptionStatus } from "@/types/database";

export type PlatformBillingStatus = "trial" | "active" | "expired" | "suspended";
export type PlatformBillingPlan = "starter" | "standard" | "premium";

export const platformPlanPrices: Record<PlatformBillingPlan, number> = {
  starter: 60000,
  standard: 90000,
  premium: 150000,
};

export function normalizePlatformStatus(subscriptionStatus: SubscriptionStatus, metadata: Json, expiresAt: string | null): PlatformBillingStatus {
  const billingStatus = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata.billing_status : null;

  if (billingStatus === "trial" || billingStatus === "active" || billingStatus === "expired" || billingStatus === "suspended") {
    return billingStatus;
  }

  if (subscriptionStatus === "trialing") return "trial";
  if (subscriptionStatus === "paused" || subscriptionStatus === "canceled") return "suspended";
  if (subscriptionStatus === "past_due") return "expired";
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return "expired";
  return "active";
}

export function toSubscriptionStatus(status: PlatformBillingStatus): SubscriptionStatus {
  if (status === "trial") return "trialing";
  if (status === "active") return "active";
  if (status === "expired") return "past_due";
  return "paused";
}

export function normalizePlatformPlan(plan: string | null | undefined): PlatformBillingPlan {
  return plan === "standard" || plan === "premium" ? plan : "starter";
}
