"use server";

import { redirect } from "next/navigation";

import { normalizeResultCode } from "@/lib/parent-portal/normalize-result-code";

export async function lookupResultCodeAction(formData: FormData) {
  const code = normalizeResultCode(String(formData.get("code") ?? ""));
  const schoolSlug = String(formData.get("schoolSlug") ?? "").trim().toLowerCase();
  const routeScope = String(formData.get("routeScope") ?? "");
  const targetBase = schoolSlug && routeScope !== "host" ? `/s/${encodeURIComponent(schoolSlug)}/results` : "/results";

  if (!code) {
    redirect(`${targetBase}?error=invalid`);
  }

  redirect(`${targetBase}/${encodeURIComponent(code)}`);
}
