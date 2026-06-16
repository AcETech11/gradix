import Link from "next/link";

import { getBillingExpiry, getBillingState, isExpiringSoon } from "@/lib/billing/billing";
import type { AuthSchool } from "@/types/auth";

export function BillingBanner({ school }: { school: AuthSchool | null }) {
  if (!school) return null;

  const state = getBillingState(school);
  const expiry = getBillingExpiry(school);
  const expiresSoon = isExpiringSoon(expiry);
  const message =
    state === "trial"
      ? "Your Gradix trial is active. Activate your subscription before the billing period ends to avoid interruption."
      : state === "expired"
        ? "Your Gradix subscription has expired. Renew to continue uploading and publishing results."
        : state === "suspended"
          ? "Your school account is suspended. Contact Gradix support."
          : expiresSoon
            ? "Your Gradix subscription expires soon. Renew early to avoid interruption."
            : null;

  if (!message) return null;

  return (
    <div className="rounded-2xl border border-orange-400/25 bg-orange-500/10 px-4 py-3 text-sm text-orange-50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="leading-6">{message}</p>
        <Link className="font-semibold text-orange-200 underline-offset-4 hover:underline" href="/dashboard/billing">
          View Billing
        </Link>
      </div>
    </div>
  );
}
