import "server-only";

import { randomBytes } from "crypto";

import { PLAN_PRICES, type BillingPlan } from "@/lib/billing/billing";

export const PAYMENT_PROOF_BUCKET = "payment-proofs";
export const PAYMENT_PROOF_MAX_BYTES = 5 * 1024 * 1024;
export const PAYMENT_PROOF_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;

export type ManualPaymentConfig = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  supportPhone: string;
  supportEmail: string;
};

export function getManualPaymentConfig(): ManualPaymentConfig {
  return {
    bankName: process.env.GRADIX_BANK_NAME ?? "Contact Gradix support",
    accountName: process.env.GRADIX_ACCOUNT_NAME ?? "Contact Gradix support",
    accountNumber: process.env.GRADIX_ACCOUNT_NUMBER ?? "Contact Gradix support",
    supportPhone: process.env.GRADIX_SUPPORT_PHONE ?? "Not configured",
    supportEmail: process.env.GRADIX_SUPPORT_EMAIL ?? "Not configured",
  };
}

export function getPlanAmount(plan: BillingPlan) {
  const value = PLAN_PRICES[plan].match(/[\d,]+/)?.[0]?.replace(/,/g, "");

  return value ? Number(value) : 0;
}

export function getCurrentBillingPeriod(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const term = month <= 4 ? "T1" : month <= 8 ? "T2" : "T3";

  return `${year}-${term}`;
}

export function getPaymentReferencePrefix(schoolName: string, billingPeriod: string) {
  const slug = schoolName
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 14) || "SCHOOL";

  return `GRADIX-${slug}-${billingPeriod}`;
}

export function buildPaymentReference(schoolName: string, billingPeriod: string) {
  const shortCode = randomBytes(2).toString("hex").toUpperCase();

  return `${getPaymentReferencePrefix(schoolName, billingPeriod)}-${shortCode}`;
}

export function formatCurrency(amount: number | null | undefined, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount ?? 0));
}

export function addBillingPeriodToDate(period: string, base = new Date()) {
  const next = new Date(base);

  if (period.includes("-T")) {
    next.setMonth(next.getMonth() + 4);
  } else {
    next.setMonth(next.getMonth() + 1);
  }

  return next;
}
